import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminProductForm from "@/components/admin/AdminProductForm";

export default function AdminNewProductPage() {
  return (
    <>
      <AdminPageHeader
        title="Add product"
        description="Create a new catalog product. Price is calculated from weight, purity, and making charge."
      />
      <AdminProductForm mode="create" />
    </>
  );
}
