import Modal from "./Modal";

const FormModal = ({ isOpen, onClose, title, children }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} width="max-w-3xl">
      {children}
    </Modal>
  );
};

export default FormModal;
