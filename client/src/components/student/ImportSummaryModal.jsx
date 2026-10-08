import Modal from "../modal/Modal";
import PrimaryButton from "../ui/PrimaryButton";

const ImportSummaryModal = ({ isOpen, onClose, result }) => {
  if (!result) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Import Summary"
      width="max-w-3xl"
    >
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl bg-green-100 p-5 text-center">
            <h2 className="text-3xl font-bold text-green-700">
              {result.imported}
            </h2>

            <p className="mt-2 text-green-700 font-medium">Imported</p>
          </div>

          <div className="rounded-xl bg-red-100 p-5 text-center">
            <h2 className="text-3xl font-bold text-red-700">{result.failed}</h2>

            <p className="mt-2  text-red-700 font-medium">Failed</p>
          </div>
        </div>

        {result.errors?.length > 0 && (
          <div>
            <h3 className="mb-3  text-red-700 text-lg font-semibold">Errors</h3>

            <div className="max-h-72 overflow-y-auto rounded-xl border">
              <table className="min-w-full">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="px-4 text-black py-3 text-left">Row</th>

                    <th className="px-4 py-3 text-black text-left">Reason</th>
                  </tr>
                </thead>

                <tbody>
                  {result.errors.map((error, index) => (
                    <tr key={index} className="border-t">
                      <td className="px-4 text-black py-3">{error.row}</td>

                      <td className="px-4 py-3 text-red-600">{error.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <PrimaryButton onClick={onClose}>Close</PrimaryButton>
        </div>
      </div>
    </Modal>
  );
};

export default ImportSummaryModal;
