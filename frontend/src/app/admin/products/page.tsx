import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminProductsTable from "@/components/admin/AdminProductsTable";

export default function AdminProductsPage() {
  return (
    <>
      <AdminPageHeader
        title="Products"
        description="Add, edit, or deactivate products in your catalog."
      />
      <AdminProductsTable />
    </>
  );
}
