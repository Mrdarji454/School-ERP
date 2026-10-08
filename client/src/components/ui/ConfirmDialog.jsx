import Modal from "../modal/Modal";
import PrimaryButton from "./PrimaryButton";
import SecondaryButton from "./SecondaryButton";

const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  loading = false,
  title = "Confirm Delete",
  message = "Are you sure you want to delete this record? This action cannot be undone.",
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} width="max-w-md">
      <div className="space-y-6">
        <p className="text-slate-600">{message}</p>

        <div className="flex justify-end gap-3">
          <SecondaryButton type="button" onClick={onClose}>
            Cancel
          </SecondaryButton>

          <PrimaryButton
            type="button"
            loading={loading}
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700"
          >
            Delete
          </PrimaryButton>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
