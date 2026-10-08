import { useRef, useState } from "react";
import { Download, FileSpreadsheet, Upload, X } from "lucide-react";

import Modal from "../modal/Modal";
import PrimaryButton from "../ui/PrimaryButton";
import SecondaryButton from "../ui/SecondaryButton";

const StudentImportModal = ({
  isOpen,
  onClose,
  onImport,
  onDownloadSample,
  loading = false,
}) => {
  const fileRef = useRef(null);

  const [file, setFile] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];

    if (!selectedFile) return;

    setFile(selectedFile);
  };

  const handleChooseFile = () => {
    fileRef.current?.click();
  };

  const removeFile = () => {
    setFile(null);

    if (fileRef.current) {
      fileRef.current.value = "";
    }
  };

  const handleImport = async () => {
    if (!file) {
      alert("Please select an Excel file.");
      return;
    }

    await onImport(file);

    removeFile();

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Import Students"
      width="max-w-2xl"
    >
      <div className="space-y-6">
        <div className="rounded-xl border-2 border-dashed border-slate-300 p-8">
          <div className="flex flex-col items-center gap-4">
            <FileSpreadsheet size={60} className="text-green-600" />

            <h3 className="text-lg font-semibold">Upload Excel / CSV File</h3>

            <p className="text-center text-sm text-slate-500">
              Supported formats
              <br />
              .xlsx .xls .csv
            </p>

            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="hidden"
            />

            <PrimaryButton type="button" onClick={handleChooseFile}>
              Choose File
            </PrimaryButton>
          </div>
        </div>

        {file && (
          <div className="flex items-center justify-between rounded-xl bg-slate-100 p-4">
            <div>
              <p className="font-semibold text-black">{file.name}</p>

              <p className="text-sm text-black">
                {(file.size / 1024).toFixed(2)} KB
              </p>
            </div>

            <button
              type="button"
              onClick={removeFile}
              className="rounded-lg p-2 transition text-black hover:bg-slate-200"
            >
              <X size={18} />
            </button>
          </div>
        )}

        <div className="flex justify-around">
          <div className="flex gap-3">
            <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>

            <PrimaryButton
              type="button"
              loading={loading}
              disabled={!file}
              onClick={handleImport}
            >
              <Upload size={18} className="mr-2" />
              Import
            </PrimaryButton>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default StudentImportModal;
