export const previewStyles = `
.preview-root {
  width: 100%;
  background: transparent;
  border-radius: 0;
  padding: 0;
  font-family: var(--token-font-sans), sans-serif;
}

.preview-page {
  display: flex;
  flex-direction: column;
  gap: var(--token-space-4);
}

.preview-section {
  background: var(--token-surface-default);
  border: 1px solid var(--token-border-subtle);
  border-radius: var(--token-radius-md);
  padding: var(--token-space-4);
  box-shadow: none;
}

.preview-section h1,
.preview-section h2,
.preview-section h3 {
  margin-top: 0;
  color: var(--token-text-primary);
}

.preview-section p {
  color: var(--token-text-secondary);
}

.preview-hero {
  display: grid;
  grid-template-columns: 1.3fr minmax(220px, 1fr);
  gap: var(--token-space-4);
  align-items: stretch;
}

.preview-eyebrow {
  margin: 0 0 var(--token-space-2) 0;
  color: var(--token-accent-primary);
  font-weight: 600;
}

.preview-hero h1 {
  font-size: var(--token-font-size-title);
  margin-bottom: var(--token-space-2);
}

.preview-body {
  margin-bottom: var(--token-space-3);
  font-size: var(--token-font-size-body);
}

.preview-cta-row {
  display: flex;
  gap: var(--token-space-2);
  flex-wrap: wrap;
}

.btn-primary,
.btn-secondary {
  border-radius: var(--token-radius-md);
  padding: 0.55rem 0.9rem;
  border: 1px solid transparent;
  cursor: pointer;
}

.btn-primary:disabled,
.btn-secondary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: var(--token-accent-primary);
  color: #ffffff;
}

.btn-secondary {
  background: transparent;
  border-color: var(--token-border-subtle);
  color: var(--token-text-primary);
}

.preview-hero-media-box {
  width: 100%;
  height: 100%;
  min-height: 180px;
  border-radius: var(--token-radius-md);
  border: 1px dashed var(--token-border-subtle);
  background: linear-gradient(135deg, #ecfeff, #dbeafe);
  display: grid;
  place-items: center;
  color: #075985;
  font-weight: 600;
}

.preview-feature-grid h2 {
  font-size: var(--token-font-size-subtitle);
}

.preview-feature-grid-cards {
  display: grid;
  gap: var(--token-space-3);
}

.preview-card {
  border: 0;
  border-radius: var(--token-radius-md);
  background: var(--token-surface-muted);
  padding: var(--token-space-3);
}

.preview-card h3 {
  margin-bottom: 0.35rem;
}

.preview-card p {
  margin: 0;
}

.preview-form-fields {
  display: grid;
  gap: var(--token-space-3);
}

.preview-form-fields.layout-inline {
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
}

.preview-form-field {
  display: grid;
  gap: 0.35rem;
}

.preview-form-field input {
  border: 1px solid var(--token-border-subtle);
  border-radius: var(--token-radius-md);
  padding: 0.45rem 0.5rem;
}

.preview-list-items {
  margin: 0;
  padding-left: 1rem;
  display: grid;
  gap: var(--token-space-2);
}

.preview-table-scroll {
  overflow-x: auto;
}

.preview-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.preview-table th,
.preview-table td {
  border: 1px solid var(--token-border-subtle);
  padding: 0.45rem 0.6rem;
  text-align: left;
}

.preview-table th {
  background: var(--token-surface-muted);
}

.preview-settings-groups {
  display: grid;
  gap: var(--token-space-3);
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
}

.preview-settings-group {
  border: 0;
  border-radius: var(--token-radius-md);
  background: var(--token-surface-muted);
  padding: var(--token-space-3);
}

.preview-settings-group h3 {
  margin: 0 0 0.5rem 0;
}

.preview-settings-group label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.preview-state-banner {
  margin: 0 0 var(--token-space-3) 0;
  padding: 0.45rem 0.65rem;
  border-radius: var(--token-radius-md);
  font-size: 0.82rem;
  font-weight: 600;
}

.preview-state-banner.state-empty {
  color: #1d4ed8;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
}

.preview-state-banner.state-loading {
  color: #1f2937;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
}

.preview-state-banner.state-error {
  color: #991b1b;
  background: #fef2f2;
  border: 1px solid #fecaca;
}

.preview-empty-copy {
  color: #1d4ed8;
  margin-top: 0;
}

.preview-card-loading {
  animation: pulse-card 1s ease-in-out infinite;
}

@keyframes pulse-card {
  0% {
    opacity: 0.78;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0.78;
  }
}

@media (max-width: 960px) {
  .preview-hero {
    grid-template-columns: 1fr;
  }
}
`;
