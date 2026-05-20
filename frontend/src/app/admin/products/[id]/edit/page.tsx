import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminProductForm from "@/components/admin/AdminProductForm";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminEditProductPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <>
      <AdminPageHeader
        title="Edit product"
        description="Update product details. Saving recalculates the store price."
      />
      <AdminProductForm mode="edit" productId={id} />
    </>
  );
}
