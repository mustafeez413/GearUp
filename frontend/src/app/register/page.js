"use client";

import { getApiBaseUrl } from '@/lib/api';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { Factory, Building2, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import {
    getCitiesForProvince,
    getFieldBorderClass,
    getPasswordStrength,
    isLocationVerified,
    LOCATION_VERIFIED_MESSAGE,
    normalizeEmail,
    normalizePhoneInput,
    REGISTRATION_FIELD_ORDER,
    REGISTRATION_PROVINCES,
    resolveCityLocationErrors,
    sanitizeRegistrationPayload,
    validateRegistrationField,
    validateRegistrationForm,
} from '@/lib/registrationValidation';

const BASE_INPUT_CLASS = 'w-full px-4 py-2 border rounded-lg focus:ring-2 transition-shadow';

function SearchableCityInput({
    value,
    onChange,
    onBlur,
    options,
    disabled,
    className,
    inputRef,
    placeholder,
}) {
    const [open, setOpen] = useState(false);
    const containerRef = useRef(null);

    const filteredOptions = options.filter((city) =>
        city.toLowerCase().includes(String(value || '').toLowerCase())
    );

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (city) => {
        onChange({ target: { name: 'city', value: city, type: 'text' } });
        setOpen(false);
    };

    return (
        <div ref={containerRef} className="relative">
            <input
                ref={inputRef}
                type="text"
                name="city"
                value={value}
                onChange={(event) => {
                    onChange(event);
                    if (!disabled) setOpen(true);
                }}
                onFocus={() => {
                    if (!disabled) setOpen(true);
                }}
                onBlur={(event) => {
                    setTimeout(() => setOpen(false), 150);
                    onBlur?.(event);
                }}
                disabled={disabled}
                className={className}
                placeholder={placeholder}
                autoComplete="off"
                role="combobox"
                aria-expanded={open}
                aria-autocomplete="list"
            />
            {open && !disabled && filteredOptions.length > 0 && (
                <ul className="absolute z-20 mt-1 w-full max-h-48 overflow-auto bg-white border border-slate-300 rounded-lg shadow-lg">
                    {filteredOptions.map((city) => (
                        <li
                            key={city}
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => handleSelect(city)}
                            className="px-4 py-2 text-sm text-slate-700 cursor-pointer hover:bg-slate-50"
                        >
                            {city}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

function FieldMessage({ error, success, successLabel = 'Looks good' }) {
    if (error) {
        return <p className="text-xs text-red-600 mt-1">{error}</p>;
    }
    if (success) {
        return <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1"><CheckCircle size={12} /> {successLabel}</p>;
    }
    return null;
}

function PasswordField({
    id,
    label,
    name,
    value,
    showPassword,
    onToggleVisibility,
    onChange,
    onBlur,
    onKeyDown,
    onKeyUp,
    className,
    setFieldRef,
    placeholder,
    fieldTouched,
    fieldError,
    children,
}) {
    const toggleLabel = showPassword ? 'Hide password' : 'Show password';

    return (
        <div>
            <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
            <div className="relative">
                <input
                    ref={setFieldRef}
                    id={id}
                    type={showPassword ? 'text' : 'password'}
                    name={name}
                    value={value}
                    onChange={onChange}
                    onBlur={onBlur}
                    onKeyDown={onKeyDown}
                    onKeyUp={onKeyUp}
                    className={className}
                    placeholder={placeholder}
                    autoComplete={name === 'password' ? 'new-password' : 'new-password'}
                />
                <button
                    type="button"
                    onClick={onToggleVisibility}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none focus-visible:text-emerald-600 rounded p-0.5"
                    aria-label={toggleLabel}
                    aria-pressed={showPassword}
                    title={toggleLabel}
                >
                    {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                </button>
            </div>
            {children}
            <FieldMessage
                error={fieldTouched ? fieldError : ''}
                success={fieldTouched && !fieldError && value}
            />
        </div>
    );
}

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: '',
        businessName: '',
        phone: '',
        shopNumber: '',
        street: '',
        area: '',
        city: '',
        province: '',
        agreedToTerms: false
    });
    const [fieldErrors, setFieldErrors] = useState({});
    const [fieldTouched, setFieldTouched] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [capsLockOn, setCapsLockOn] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const router = useRouter();
    const fieldRefs = useRef({});

    const provinces = ['Punjab'];
    const provinceCities = getCitiesForProvince(formData.province);
    const locationVerified = isLocationVerified(formData);
    const cityDisabled = !formData.province;

    const passwordStrength = getPasswordStrength(formData.password);

    const setFieldRef = (name) => (el) => {
        if (el) fieldRefs.current[name] = el;
    };

    const runLocationValidation = (nextData = formData) => {
        const locationErrors = resolveCityLocationErrors(nextData);
        setFieldErrors((prev) => ({
            ...prev,
            city: locationErrors.city || '',
            province: locationErrors.province || '',
        }));
    };

    const runFieldValidation = (fieldName, nextData = formData) => {
        if (fieldName === 'city' || fieldName === 'province') {
            runLocationValidation(nextData);
            return;
        }
        const message = validateRegistrationField(fieldName, nextData);
        setFieldErrors((prev) => ({ ...prev, [fieldName]: message }));
    };

    const markTouched = (fieldName) => {
        setFieldTouched((prev) => ({ ...prev, [fieldName]: true }));
    };

    const handleBlur = (e) => {
        const { name } = e.target;
        markTouched(name);
        runFieldValidation(name);
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        let nextValue = type === 'checkbox' ? checked : value;

        if (name === 'email') {
            nextValue = normalizeEmail(value);
        } else if (name === 'phone') {
            nextValue = normalizePhoneInput(value);
        }

        let nextData = { ...formData, [name]: nextValue };

        if (name === 'province') {
            nextData = { ...nextData, city: '' };
        }

        setFormData(nextData);

        if (name === 'city') {
            setFieldTouched((prev) => ({ ...prev, city: true }));
            runLocationValidation(nextData);
        } else if (name === 'province') {
            setFieldTouched((prev) => ({ ...prev, province: true, city: false }));
            setFieldErrors((prev) => ({ ...prev, city: '' }));
            runLocationValidation(nextData);
        } else if (
            fieldTouched[name] ||
            name === 'email' ||
            name === 'phone' ||
            name === 'shopNumber' ||
            name === 'street'
        ) {
            if (name === 'shopNumber' || name === 'street') {
                setFieldTouched((prev) => ({ ...prev, [name]: true }));
            }
            runFieldValidation(name, nextData);
        }

        if (name === 'password' && fieldTouched.confirmPassword) {
            runFieldValidation('confirmPassword', nextData);
        }
    };

    const handleRoleSelect = (role) => {
        const nextData = { ...formData, role };
        setFormData(nextData);
        markTouched('role');
        runFieldValidation('role', nextData);
    };

    const handleTermsChange = (checked) => {
        const nextData = { ...formData, agreedToTerms: checked };
        setFormData(nextData);
        markTouched('agreedToTerms');
        runFieldValidation('agreedToTerms', nextData);
    };

    const handleCapsLockCheck = (e) => {
        if (typeof e.getModifierState === 'function') {
            setCapsLockOn(e.getModifierState('CapsLock'));
        }
    };

    const validateAllFields = () => {
        const allTouched = REGISTRATION_FIELD_ORDER.reduce((acc, field) => {
            acc[field] = true;
            return acc;
        }, {});
        setFieldTouched(allTouched);

        const result = validateRegistrationForm(formData);
        setFieldErrors(result.errors);
        return result;
    };

    const focusFirstInvalidField = (errors) => {
        const firstInvalid = REGISTRATION_FIELD_ORDER.find((field) => errors[field]);
        if (!firstInvalid) return;
        const target = fieldRefs.current[firstInvalid];
        if (target?.scrollIntoView) {
            target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        if (target?.focus) {
            target.focus();
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const validation = validateAllFields();
        if (!validation.isValid) {
            setError(Object.values(validation.errors)[0] || 'Please fix the highlighted fields.');
            focusFirstInvalidField(validation.errors);
            setLoading(false);
            return;
        }

        const payload = validation.sanitized;

        try {
            const formDataToSend = new FormData();
            Object.keys(payload).forEach((key) => {
                formDataToSend.append(key, payload[key]);
            });

            const registerUrl = `${getApiBaseUrl()}/api/auth/register`;
            console.log('[register] POST', registerUrl, payload);

            const response = await fetch(registerUrl, {
                method: 'POST',
                body: formDataToSend
            });

            console.log('[register] status', response.status);

            let data = {};
            const responseText = await response.text();
            if (responseText) {
                try {
                    data = JSON.parse(responseText);
                } catch {
                    throw new Error(
                        response.ok
                            ? 'Unexpected server response.'
                            : `Server error occurred (${response.status}).`
                    );
                }
            }

            console.log('[register] body', data);

            if (!response.ok) {
                throw new Error(data.error || 'Failed to create account');
            }

            // explicitly wipe out any guest cart from previous session
            if (typeof window !== 'undefined') {
                localStorage.removeItem('wholesaler_cart');
                sessionStorage.removeItem('wholesaler_cart');
            }

            await login(data.user, data.token);

            router.push(`/verify-email?email=${encodeURIComponent(payload.email)}`);
        } catch (err) {
            console.error('[register] submit failed:', err);
            if (err.message === 'Failed to fetch') {
                setError(`Unable to connect to the server at ${getApiBaseUrl()}. Please ensure the backend is running and try again.`);
            } else {
                setError(err.message || 'Failed to create account. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const roles = [
        {
            value: 'manufacturer',
            label: 'Manufacturer',
            description: 'Sell products in bulk to wholesalers',
            icon: Factory
        },
        {
            value: 'wholesaler',
            label: 'Wholesaler',
            description: 'Buy in bulk directly from manufacturers',
            icon: Building2
        }
    ];

    const inputClass = (fieldName) => `${BASE_INPUT_CLASS} ${getFieldBorderClass(fieldName, fieldErrors, fieldTouched, formData)}`;

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#064E3B] py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
            <div className="max-w-4xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row">
                <div className="w-full p-8 md:p-12">
                    <div className="text-center mb-10">
                        <h1 className="font-heading text-3xl font-bold text-slate-900 mb-2">Create Business Account</h1>
                        <p className="text-slate-600">Join the premier B2B sports commerce platform</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
                            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-8" noValidate>
                        <div ref={setFieldRef('role')}>
                            <label className="block text-sm font-semibold text-slate-700 mb-4 uppercase tracking-wider">Select Business Role</label>
                            <div className="grid md:grid-cols-2 gap-4">
                                {roles.map((role) => {
                                    const Icon = role.icon;
                                    const isSelected = formData.role === role.value;
                                    return (
                                        <div
                                            key={role.value}
                                            onClick={() => handleRoleSelect(role.value)}
                                            className={`cursor-pointer group relative p-4 rounded-xl border-2 transition-all duration-300 ease-in-out ${isSelected
                                                ? 'border-emerald-600 bg-emerald-50 shadow-md'
                                                : 'border-slate-200 hover:border-emerald-400 hover:shadow-md'
                                                }`}
                                        >
                                            <div className={`flex flex-col items-center text-center space-y-3 ${isSelected ? 'text-emerald-800' : 'text-slate-600'}`}>
                                                <div className={`p-3 rounded-full ${isSelected ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 group-hover:bg-emerald-50 group-hover:text-emerald-600'}`}>
                                                    <Icon size={28} />
                                                </div>
                                                <div>
                                                    <h3 className={`font-bold ${isSelected ? 'text-emerald-900' : 'text-slate-900'}`}>{role.label}</h3>
                                                    <p className="text-xs mt-1 leading-snug opacity-80">{role.description}</p>
                                                </div>
                                            </div>
                                            {isSelected && (
                                                <div className="absolute top-2 right-2 text-emerald-600">
                                                    <CheckCircle size={16} fill="currentColor" className="text-white" />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                            <FieldMessage
                                error={fieldTouched.role ? fieldErrors.role : ''}
                                success={fieldTouched.role && !fieldErrors.role && formData.role}
                            />
                        </div>

                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Personal Details</h3>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                                    <input
                                        ref={setFieldRef('name')}
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        className={inputClass('name')}
                                        placeholder="Your Full Name"
                                    />
                                    <FieldMessage
                                        error={fieldTouched.name ? fieldErrors.name : ''}
                                        success={fieldTouched.name && !fieldErrors.name && formData.name}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                                    <input
                                        ref={setFieldRef('email')}
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        className={inputClass('email')}
                                        placeholder="Your Email Address"
                                    />
                                    <FieldMessage
                                        error={fieldTouched.email ? fieldErrors.email : ''}
                                        success={fieldTouched.email && !fieldErrors.email && formData.email}
                                    />
                                </div>
                                <PasswordField
                                    id="register-password"
                                    label="Password"
                                    name="password"
                                    value={formData.password}
                                    showPassword={showPassword}
                                    onToggleVisibility={() => setShowPassword((prev) => !prev)}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    onKeyDown={handleCapsLockCheck}
                                    onKeyUp={handleCapsLockCheck}
                                    className={`${inputClass('password')} pr-11`}
                                    setFieldRef={setFieldRef('password')}
                                    placeholder="••••••••"
                                    fieldTouched={fieldTouched.password}
                                    fieldError={fieldErrors.password}
                                >
                                    {capsLockOn && (
                                        <p className="text-xs text-amber-600 mt-1" role="status" aria-live="polite">
                                            Caps Lock is ON
                                        </p>
                                    )}
                                    {formData.password && passwordStrength && (
                                        <div className="mt-2">
                                            <div className="flex items-center justify-between text-xs mb-1">
                                                <span className="text-slate-500">Password strength</span>
                                                <span className={`font-semibold ${passwordStrength === 'Strong'
                                                    ? 'text-emerald-600'
                                                    : passwordStrength === 'Medium'
                                                        ? 'text-amber-600'
                                                        : 'text-red-600'
                                                    }`}>
                                                    {passwordStrength}
                                                </span>
                                            </div>
                                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full transition-all duration-300 ${passwordStrength === 'Strong'
                                                        ? 'w-full bg-emerald-500'
                                                        : passwordStrength === 'Medium'
                                                            ? 'w-2/3 bg-amber-500'
                                                            : 'w-1/3 bg-red-500'
                                                        }`}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </PasswordField>
                                <PasswordField
                                    id="register-confirm-password"
                                    label="Confirm Password"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    showPassword={showConfirmPassword}
                                    onToggleVisibility={() => setShowConfirmPassword((prev) => !prev)}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    onKeyDown={handleCapsLockCheck}
                                    onKeyUp={handleCapsLockCheck}
                                    className={`${inputClass('confirmPassword')} pr-11`}
                                    setFieldRef={setFieldRef('confirmPassword')}
                                    placeholder="••••••••"
                                    fieldTouched={fieldTouched.confirmPassword}
                                    fieldError={fieldErrors.confirmPassword}
                                />
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Business Details</h3>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Business Name</label>
                                    <input
                                        ref={setFieldRef('businessName')}
                                        type="text"
                                        name="businessName"
                                        value={formData.businessName}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        className={inputClass('businessName')}
                                        placeholder="Your Business Name"
                                    />
                                    <FieldMessage
                                        error={fieldTouched.businessName ? fieldErrors.businessName : ''}
                                        success={fieldTouched.businessName && !fieldErrors.businessName && formData.businessName}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number (Pakistan)</label>
                                    <input
                                        ref={setFieldRef('phone')}
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        className={inputClass('phone')}
                                        placeholder="Your Phone Number"
                                    />
                                    <FieldMessage
                                        error={fieldTouched.phone ? fieldErrors.phone : ''}
                                        success={fieldTouched.phone && !fieldErrors.phone && formData.phone}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Shop/House #</label>
                                        <input
                                            ref={setFieldRef('shopNumber')}
                                            type="text"
                                            name="shopNumber"
                                            value={formData.shopNumber}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            className={inputClass('shopNumber')}
                                            placeholder="Your Shop #"
                                        />
                                        <FieldMessage
                                            error={fieldTouched.shopNumber ? fieldErrors.shopNumber : ''}
                                            success={fieldTouched.shopNumber && !fieldErrors.shopNumber && formData.shopNumber}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Street</label>
                                        <input
                                            ref={setFieldRef('street')}
                                            type="text"
                                            name="street"
                                            value={formData.street}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            className={inputClass('street')}
                                            placeholder="Your Street"
                                        />
                                        <FieldMessage
                                            error={fieldTouched.street ? fieldErrors.street : ''}
                                            success={fieldTouched.street && !fieldErrors.street && formData.street}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Area/Sector</label>
                                    <input
                                        ref={setFieldRef('area')}
                                        type="text"
                                        name="area"
                                        value={formData.area}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        className={inputClass('area')}
                                        placeholder="Your Area/Sector"
                                    />
                                    <FieldMessage
                                        error={fieldTouched.area ? fieldErrors.area : ''}
                                        success={fieldTouched.area && !fieldErrors.area && formData.area}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
                                        <SearchableCityInput
                                            inputRef={setFieldRef('city')}
                                            value={formData.city}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            options={provinceCities}
                                            disabled={cityDisabled}
                                            className={`${inputClass('city')} ${cityDisabled ? 'bg-slate-50 cursor-not-allowed' : ''}`}
                                            placeholder={cityDisabled ? 'Select province first' : 'Search city (e.g. Rawalpindi)'}
                                        />
                                        <FieldMessage
                                            error={fieldTouched.city ? fieldErrors.city : ''}
                                            success={fieldTouched.city && !fieldErrors.city && formData.city && locationVerified}
                                            successLabel={LOCATION_VERIFIED_MESSAGE}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Province</label>
                                        <select
                                            ref={setFieldRef('province')}
                                            name="province"
                                            value={formData.province}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            className={inputClass('province')}
                                        >
                                            <option value="">Select Province</option>
                                            {provinces.map(prov => (
                                                <option key={prov} value={prov}>{prov}</option>
                                            ))}
                                        </select>
                                        <FieldMessage
                                            error={fieldTouched.province ? fieldErrors.province : ''}
                                            success={fieldTouched.province && !fieldErrors.province && formData.province && (locationVerified || !formData.city)}
                                            successLabel={locationVerified ? LOCATION_VERIFIED_MESSAGE : 'Looks good'}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 mt-6 mb-2" ref={setFieldRef('agreedToTerms')}>
                            <input
                                type="checkbox"
                                id="agreedToTerms"
                                name="agreedToTerms"
                                checked={formData.agreedToTerms}
                                onChange={(e) => handleTermsChange(e.target.checked)}
                                onBlur={() => {
                                    markTouched('agreedToTerms');
                                    runFieldValidation('agreedToTerms');
                                }}
                                className="w-5 h-5 mt-0.5 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500 cursor-pointer"
                            />
                            <label htmlFor="agreedToTerms" className="text-sm text-slate-600 font-medium select-none cursor-pointer">
                                I agree to the{' '}
                                <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-emerald-700 font-bold hover:underline">
                                    Terms & Conditions
                                </a>{' '}
                                &{' '}
                                <a href="/commission-policy" target="_blank" rel="noopener noreferrer" className="text-emerald-700 font-bold hover:underline">
                                    Commission Policies
                                </a>{' '}
                                and{' '}
                                <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-emerald-700 font-bold hover:underline">
                                    Privacy Policies
                                </a>.
                            </label>
                        </div>
                        <FieldMessage
                            error={fieldTouched.agreedToTerms ? fieldErrors.agreedToTerms : ''}
                            success={fieldTouched.agreedToTerms && !fieldErrors.agreedToTerms && formData.agreedToTerms}
                        />

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Creating Account...' : 'Create Business Account'}
                        </button>
                    </form>

                    <div className="mt-6 flex items-center justify-center">
                        <span className="text-sm text-slate-500 font-medium">Or continue with</span>
                    </div>

                    <div className="mt-6 flex justify-center">
                        <GoogleLogin
                            onSuccess={async (credentialResponse) => {
                                try {
                                    if (!formData.role) {
                                        setError('Please select a business role before signing in with Google');
                                        markTouched('role');
                                        runFieldValidation('role');
                                        return;
                                    }
                                    setError('');
                                    setLoading(true);
                                    const response = await fetch(`${getApiBaseUrl()}/api/auth/google`, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                            token: credentialResponse.credential,
                                            role: formData.role
                                        })
                                    });
                                    const data = await response.json();
                                    if (!response.ok) throw new Error(data.error || 'Google Sign In failed');

                                    if (typeof window !== 'undefined') {
                                        localStorage.removeItem('wholesaler_cart');
                                        sessionStorage.removeItem('wholesaler_cart');
                                    }

                                    await login(data.user, data.token);

                                    if (data.user.role === 'manufacturer') router.replace('/manufacturer/dashboard');
                                    else if (data.user.role === 'wholesaler') router.replace('/wholesaler/dashboard');
                                    else if (data.user.role === 'admin') router.replace('/admin/dashboard');
                                    else router.replace('/');
                                } catch (err) {
                                    setError(err.message || 'Failed to sign in with Google.');
                                } finally {
                                    setLoading(false);
                                }
                            }}
                            onError={() => {
                                setError('Google Sign In failed');
                            }}
                            useOneTap
                        />
                    </div>

                    <div className="mt-8 text-center">
                        <p className="text-slate-600">
                            Already have an account?{' '}
                            <Link href="/login" className="text-emerald-700 font-bold hover:text-emerald-800 transition-colors">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
