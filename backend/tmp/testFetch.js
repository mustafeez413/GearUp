async function test() {
  try {
    const res = await fetch('http://localhost:5000/api/advertisements/sponsored?placement=sponsored_product&limit=12');
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(err.message);
  }
}
test();
