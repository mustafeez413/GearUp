import ProductForm from '@/components/manufacturer/ProductForm';

export const metadata = {
    title: 'Update Manifest | GearUp Manufacturer',
};

export default async function EditProductPage({ params }) {
    const { id } = await params;
    return <ProductForm id={id} />;
}
