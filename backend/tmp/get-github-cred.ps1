$ErrorActionPreference = 'Stop'

Add-Type @"
using System;
using System.Runtime.InteropServices;
using System.Text;

public class WinCred {
    public enum CredentialType { Generic = 1 }
    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
    public struct CREDENTIAL {
        public int Flags;
        public int Type;
        public string TargetName;
        public string Comment;
        public System.Runtime.InteropServices.ComTypes.FILETIME LastWritten;
        public int CredentialBlobSize;
        public IntPtr CredentialBlob;
        public int Persist;
        public int AttributeCount;
        public IntPtr Attributes;
        public string TargetAlias;
        public string UserName;
    }
    [DllImport("advapi32.dll", SetLastError = true, CharSet = CharSet.Unicode)]
    public static extern bool CredRead(string target, int type, int reservedFlag, out IntPtr credentialPtr);
    [DllImport("advapi32.dll", SetLastError = true)]
    public static extern bool CredFree(IntPtr cred);
}
"@

function Read-Cred([string]$Target) {
    $ptr = [IntPtr]::Zero
    if (-not [WinCred]::CredRead($Target, [WinCred+CredentialType]::Generic, 0, [ref]$ptr)) {
        return $null
    }
    try {
        $cred = [Runtime.InteropServices.Marshal]::PtrToStructure($ptr, [type][WinCred+CREDENTIAL])
        $passwordBytes = New-Object byte[] $cred.CredentialBlobSize
        [Runtime.InteropServices.Marshal]::Copy($cred.CredentialBlob, $passwordBytes, 0, $cred.CredentialBlobSize)
        $password = [Text.Encoding]::Unicode.GetString($passwordBytes).TrimEnd([char]0)
        return [PSCustomObject]@{ UserName = $cred.UserName; Password = $password }
    } finally {
        [WinCred]::CredFree($ptr) | Out-Null
    }
}

$targets = @(
    'git:https://github.com',
    'LegacyGeneric:target=git:https://github.com',
    'LegacyGeneric:target=GitHub - https://api.github.com/hamzhehe'
)

foreach ($target in $targets) {
    $cred = Read-Cred $target
    if ($null -ne $cred -and $cred.Password) {
        $env:GH_USER = $cred.UserName
        $env:GH_TOKEN = $cred.Password
        return
    }
}

if ($env:GITHUB_TOKEN) {
    $env:GH_USER = 'hamzhehe'
    $env:GH_TOKEN = $env:GITHUB_TOKEN
    return
}

throw 'No GitHub credentials found in Windows Credential Manager.'
