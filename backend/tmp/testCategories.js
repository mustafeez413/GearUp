async function test() {
  const res = await fetch('http://localhost:5000/api/products/categories');
  const data = await res.json();
  console.log(data);
}
test();
