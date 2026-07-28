const fs = require('fs');
const path = require('path');

// 1. Fix app/page.tsx modals styling and pass showAlert prop
let pageContent = fs.readFileSync('app/page.tsx', 'utf-8');

// Replace the modals JSX in page.tsx
const oldModalsJSX = `      {/* Custom Alert Modal */}
      {alertModal.isOpen && (
        <div className="modal-overlay" onClick={() => setAlertModal({ ...alertModal, isOpen: false })}>
          <div className="modal-content glass-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px', textAlign: 'center', zIndex: 10000 }}>
            <h2 style={{ marginBottom: '1rem', color: 'var(--text-primary)', fontSize: '1.2rem' }}>{alertModal.title}</h2>
            <p style={{ marginBottom: '2rem', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>{alertModal.message}</p>
            <button className="action-button primary" onClick={() => setAlertModal({ ...alertModal, isOpen: false })} style={{ width: '100%', padding: '0.8rem', fontSize: '1rem' }}>
              OK
            </button>
          </div>
        </div>
      )}

      {/* Custom Confirm Modal */}
      {confirmModal.isOpen && (
        <div className="modal-overlay" onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}>
          <div className="modal-content glass-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px', textAlign: 'center', zIndex: 10000 }}>
            <h2 style={{ marginBottom: '1rem', color: 'var(--text-primary)', fontSize: '1.2rem' }}>{confirmModal.title}</h2>
            <p style={{ marginBottom: '2rem', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>{confirmModal.message}</p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button className="action-button secondary" onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })} style={{ flex: 1, padding: '0.8rem', fontSize: '1rem' }}>
                キャンセル
              </button>
              <button className="action-button primary" onClick={() => { confirmModal.onConfirm(); setConfirmModal({ ...confirmModal, isOpen: false }); }} style={{ flex: 1, padding: '0.8rem', fontSize: '1rem', background: '#ef4444', borderColor: '#ef4444' }}>
                実行
              </button>
            </div>
          </div>
        </div>
      )}`;

const newModalsJSX = `      {/* Custom Alert Modal */}
      {alertModal.isOpen && (
        <div className="modal-overlay" onClick={() => setAlertModal({ ...alertModal, isOpen: false })}>
          <div className="modal-content glass-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px', textAlign: 'center', zIndex: 10000, background: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255, 255, 255, 0.4)', boxShadow: '0 8px 32px rgba(31, 38, 135, 0.15)' }}>
            <h2 style={{ marginBottom: '1rem', color: 'var(--text-primary)', fontSize: '1.2rem', fontWeight: 'bold' }}>{alertModal.title}</h2>
            <p style={{ marginBottom: '2rem', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>{alertModal.message}</p>
            <button className="action-button" onClick={() => setAlertModal({ ...alertModal, isOpen: false })} style={{ width: '100%', padding: '0.8rem', fontSize: '1rem', background: 'rgba(255, 255, 255, 0.6)', color: 'var(--text-primary)', border: '1px solid rgba(0, 0, 0, 0.1)', borderRadius: '12px', fontWeight: 'bold', transition: 'all 0.2s ease' }}>
              OK
            </button>
          </div>
        </div>
      )}

      {/* Custom Confirm Modal */}
      {confirmModal.isOpen && (
        <div className="modal-overlay" onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}>
          <div className="modal-content glass-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px', textAlign: 'center', zIndex: 10000, background: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255, 255, 255, 0.4)', boxShadow: '0 8px 32px rgba(31, 38, 135, 0.15)' }}>
            <h2 style={{ marginBottom: '1rem', color: 'var(--text-primary)', fontSize: '1.2rem', fontWeight: 'bold' }}>{confirmModal.title}</h2>
            <p style={{ marginBottom: '2rem', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>{confirmModal.message}</p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button className="action-button" onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })} style={{ flex: 1, padding: '0.8rem', fontSize: '1rem', background: 'rgba(255, 255, 255, 0.5)', color: 'var(--text-secondary)', border: '1px solid rgba(0, 0, 0, 0.1)', borderRadius: '12px' }}>
                キャンセル
              </button>
              <button className="action-button" onClick={() => { confirmModal.onConfirm(); setConfirmModal({ ...confirmModal, isOpen: false }); }} style={{ flex: 1, padding: '0.8rem', fontSize: '1rem', background: 'rgba(254, 226, 226, 0.7)', color: '#b91c1c', border: '1px solid rgba(248, 113, 113, 0.3)', borderRadius: '12px', fontWeight: 'bold' }}>
                実行
              </button>
            </div>
          </div>
        </div>
      )}`;

pageContent = pageContent.replace(oldModalsJSX, newModalsJSX);

// Pass showAlert to all modals
const modalsToUpdate = ['ExpenseModal', 'TransferModal', 'FixedExpensesModal', 'RawJsonEditorModal', 'OffsetModal', 'TripReconcileModal', 'CsvReconcileModal'];

modalsToUpdate.forEach(modalName => {
  // Regex to find <ModalName ... > or <ModalName ... />
  const regex = new RegExp(\`<\${modalName}(?:\\\\s+[^>]*?)?>\`, 'g');
  pageContent = pageContent.replace(regex, (match) => {
    if (match.includes('showAlert=')) return match;
    // insert showAlert={showAlert} before the closing >
    return match.replace(/>$/, ' showAlert={showAlert}>');
  });
});

fs.writeFileSync('app/page.tsx', pageContent, 'utf-8');

// 2. Update each modal file to accept showAlert and replace alert( with showAlert(
modalsToUpdate.forEach(modalName => {
  const filePath = path.join('app/components/modals', \`\${modalName}.tsx\`);
  if (!fs.existsSync(filePath)) return;

  let modalContent = fs.readFileSync(filePath, 'utf-8');
  
  // Replace window.alert( or alert( with alertFn(
  modalContent = modalContent.replace(/window\\.alert\\(/g, 'alertFn(');
  modalContent = modalContent.replace(/\\balert\\(/g, 'alertFn(');

  // Add showAlert?: (msg: string) => void; to the props interface
  if (!modalContent.includes('showAlert?:')) {
    modalContent = modalContent.replace(/interface\\s+[A-Za-z]+Props\\s*\\{/, (match) => {
      return match + '\\n  showAlert?: (msg: string) => void;';
    });
  }

  // Find the component function declaration to extract showAlert from props
  // e.g. export const ExpenseModal = ({ onClose, ... }: ExpenseModalProps) => {
  // e.g. export function ExpenseModal({ onClose, ... }) {
  modalContent = modalContent.replace(/(export\\s+(?:const\\s+\\w+\\s*=\\s*\\(|function\\s+\\w+\\s*\\()\\s*\\{\\s*)([^\\}]+?)(\\s*\\})/, (match, p1, p2, p3) => {
    if (!p2.includes('showAlert')) {
      return p1 + p2 + ', showAlert' + p3;
    }
    return match;
  });

  // Inject const alertFn = showAlert || window.alert; right after the function opens
  // We can just find the first "{" after the component declaration.
  // A simple way is to replace `showAlert` extraction and then add the line.
  modalContent = modalContent.replace(/(export\\s+(?:const\\s+\\w+\\s*=\\s*\\(|function\\s+\\w+\\s*\\()\\s*\\{[^\\}]*\\}\\s*(?::\\s*[a-zA-Z<>]+)?\\s*(?:=>)?\\s*\\{\\n?)/, (match) => {
    if (match.includes('const alertFn = showAlert || window.alert;')) return match;
    return match + '  const alertFn = showAlert || window.alert;\\n';
  });

  fs.writeFileSync(filePath, modalContent, 'utf-8');
});

console.log('Done');
