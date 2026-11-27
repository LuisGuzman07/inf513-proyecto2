import { Alert, Button, Collapse, Flex, Modal, Typography, Upload } from 'antd';
import {
  DownloadOutlined,
  FileTextOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { isCancel } from 'axios';
import { useEffect, useRef, useState } from 'react';
import { errorText, fieldErrors, httpStatus, pilotApi } from './api';
import { usePilotSession } from './context';
import { documentTypes, validateFile } from './workflow';
import type { DocumentMetadata, DocumentType, RecordDetail } from './types';
import { formatRecordDate } from './presentation-data';
import './documents.css';

export function Documents({
  record,
  editable = false,
  busy = false,
  missingDocumentType,
  onBusy,
  onUploaded,
  onSelected,
  onSelectionChange,
  reload,
}: {
  record: RecordDetail;
  editable?: boolean;
  busy?: boolean;
  missingDocumentType?: DocumentType;
  onBusy?: (value: boolean) => void;
  onUploaded?: (record: RecordDetail) => void;
  onSelected?: () => void;
  onSelectionChange?: (hasSelected: boolean) => void;
  reload?: () => void;
}) {
  const { session, generation } = usePilotSession();
  const [selected, setSelected] = useState<Partial<Record<DocumentType, File>>>(
    {}
  );
  const [pending, setPending] = useState(false);
  const selection = useRef<Partial<Record<DocumentType, File>>>({});
  const selectionCallback = useRef(onSelectionChange);
  selectionCallback.current = onSelectionChange;
  function choose(type: DocumentType, file?: File) {
    const next = { ...selection.current, [type]: file };
    selection.current = next;
    setSelected(next);
    selectionCallback.current?.(Object.values(next).some(Boolean));
  }
  const lock = useRef(false);
  const requestController = useRef(new AbortController());
  useEffect(() => {
    const controller = new AbortController();
    requestController.current = controller;
    return () => {
      controller.abort();
      selectionCallback.current?.(false);
    };
  }, []);
  const [failure, setFailure] = useState<unknown>(null);
  const [validation, setValidation] = useState<{
    type: DocumentType;
    message: string;
  } | null>(null);
  const [failureType, setFailureType] = useState<DocumentType | null>(null);
  const [confirmReload, setConfirmReload] = useState(false);
  async function upload(type: DocumentType) {
    const file = selected[type];
    if (!file || lock.current || busy) return;
    lock.current = true;
    setPending(true);
    onBusy?.(true);
    setFailure(null);
    setFailureType(type);
    try {
      const result = await session.run(
        (signal) =>
          pilotApi.upload(record.id, type, file, record.version, signal),
        requestController.current.signal
      );
      if (generation !== session.snapshot.generation) return;
      onUploaded?.({
        ...record,
        version: result.registration_version,
        documents: [...record.documents, result.document],
      });
      void session.client.invalidateQueries({
        queryKey: session.key('detail', record.id),
        refetchType: 'none',
      });
      choose(type);
      session.client.removeQueries({
        queryKey: session.key('history', record.id),
      });
    } catch (error) {
      if (!isCancel(error) && generation === session.snapshot.generation)
        setFailure(error);
    } finally {
      lock.current = false;
      if (generation === session.snapshot.generation) {
        setPending(false);
        onBusy?.(false);
      }
    }
  }
  async function download(doc: DocumentMetadata) {
    if (lock.current || busy) return;
    lock.current = true;
    setPending(true);
    setFailure(null);
    setFailureType(doc.type);
    try {
      const blob = await session.run(
        (signal) => pilotApi.download(record.id, doc.id, signal),
        requestController.current.signal
      );
      if (generation !== session.snapshot.generation) return;
      const url = URL.createObjectURL(blob);
      try {
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = doc.original_name;
        document.body.append(anchor);
        anchor.click();
        anchor.remove();
      } finally {
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      if (!isCancel(error) && generation === session.snapshot.generation)
        setFailure(error);
    } finally {
      lock.current = false;
      if (generation === session.snapshot.generation) setPending(false);
    }
  }
  return (
    <div id="documentos" className="pilot-documents">
      <Typography.Title level={2}>Documentos</Typography.Title>
      <Typography.Paragraph>
        Formatos permitidos: PDF, JPEG o PNG, máximo 10 MiB. Fotografía: JPEG o
        PNG. Se conservan las versiones anteriores; los archivos no se publican.
      </Typography.Paragraph>
      <Typography.Paragraph className="pilot-documents-note">
        Un archivo cargado no acredita su autenticidad ni una revisión o
        aprobación.
      </Typography.Paragraph>
      {pending ? (
        <Typography.Paragraph aria-live="polite">
          Operación documental en curso…
        </Typography.Paragraph>
      ) : null}
      <div className="pilot-documents-list">
        {documentTypes.map((item) => {
          const versions = record.documents
            .filter((doc) => doc.type === item.type)
            .sort((a, b) => b.version - a.version);
          const current = versions[0];
          const previous = versions.slice(1);
          const metadata = (doc: DocumentMetadata) => (
            <Flex
              key={doc.id}
              gap={16}
              align="center"
              justify="space-between"
              wrap
            >
              <Flex vertical gap={8} className="pilot-documents-metadata">
                <Typography.Text strong className="pilot-documents-name">
                  {doc.original_name}
                </Typography.Text>
                <Typography.Text
                  type="secondary"
                  className="pilot-documents-version"
                >
                  Versión {doc.version} · {formatRecordDate(doc.created_at)} ·{' '}
                  {doc.size.toLocaleString('es-BO')} bytes
                </Typography.Text>
              </Flex>
              <Button
                icon={<DownloadOutlined />}
                disabled={pending || busy}
                onClick={() => void download(doc)}
                aria-label={
                  'Descargar ' + item.label + ' versión ' + doc.version
                }
              >
                Descargar
              </Button>
            </Flex>
          );
          const missingForSubmit = missingDocumentType === item.type;
          const submissionHintId =
            'submission-requirement-document-' + item.type;
          return (
            <div
              key={item.type}
              id={'document-' + item.type}
              tabIndex={-1}
              className="pilot-documents-row"
              role="group"
              aria-labelledby={'document-title-' + item.type}
            >
              <div className="pilot-documents-heading">
                <FileTextOutlined
                  className="pilot-documents-icon"
                  aria-hidden="true"
                />
                <div className="pilot-documents-heading-copy">
                  <Typography.Title
                    id={'document-title-' + item.type}
                    level={3}
                    className="pilot-documents-title"
                  >
                    {item.label}
                  </Typography.Title>
                  <Typography.Text type="secondary">
                    {item.required ? 'Necesario para enviar' : 'Opcional'}
                  </Typography.Text>
                  {item.type === 'cv' && (
                    <Typography.Text type="secondary" style={{ display: 'block', fontSize: 12, marginTop: 2, color: '#1677ff' }}>
                      Completá tus datos y experiencia en la sección <strong>Currículum / Solicitud</strong> del formulario digital.
                    </Typography.Text>
                  )}
                </div>
                <span className="pilot-documents-state">
                  {current ? 'Cargado' : 'Sin adjuntar'}
                </span>
              </div>
              {current ? (
                <div className="pilot-documents-current">
                  <Typography.Text>Archivo vigente</Typography.Text>
                  {metadata(current)}
                </div>
              ) : (
                <Typography.Paragraph
                  className="pilot-documents-current"
                  type="secondary"
                >
                  Sin archivo adjunto
                </Typography.Paragraph>
              )}
              {missingForSubmit ? (
                <Typography.Text
                  id={submissionHintId}
                  className="pilot-documents-required-hint"
                  type="warning"
                >
                  Necesario para enviar: adjuntá este documento.
                </Typography.Text>
              ) : null}
              {previous.length ? (
                <Collapse
                  className="pilot-documents-history"
                  items={[
                    {
                      key: item.type,
                      label:
                        'Versiones anteriores de ' +
                        item.label +
                        ' (' +
                        previous.length +
                        ')',
                      children: (
                        <Flex vertical gap={16}>
                          {previous.map(metadata)}
                        </Flex>
                      ),
                    },
                  ]}
                />
              ) : null}
              {editable ? (
                <Flex className="pilot-documents-upload" gap={12} wrap>
                  <Upload
                    accept={
                      item.type === 'fotografia'
                        ? '.jpg,.jpeg,.png'
                        : '.pdf,.jpg,.jpeg,.png'
                    }
                    maxCount={1}
                    disabled={pending || busy}
                    fileList={
                      selected[item.type]
                        ? [
                            {
                              uid: item.type,
                              name: selected[item.type]!.name,
                            },
                          ]
                        : []
                    }
                    beforeUpload={(file) => {
                      const error = validateFile(item.type, file);
                      setValidation(
                        error ? { type: item.type, message: error } : null
                      );
                      if (!error) {
                        onSelected?.();
                        choose(item.type, file);
                      }
                      return false;
                    }}
                    onRemove={() => {
                      choose(item.type);
                    }}
                  >
                    <Button
                      icon={<UploadOutlined />}
                      disabled={pending || busy}
                      aria-label={'Seleccionar ' + item.label}
                      aria-describedby={
                        [
                          missingForSubmit ? submissionHintId : '',
                          validation?.type === item.type
                            ? 'document-error-' + item.type
                            : '',
                        ]
                          .filter(Boolean)
                          .join(' ') || undefined
                      }
                    >
                      Seleccionar archivo
                    </Button>
                  </Upload>
                  <Button
                    disabled={!selected[item.type] || pending || busy}
                    onClick={() => void upload(item.type)}
                    aria-label={
                      (current ? 'Sustituir ' : 'Adjuntar ') + item.label
                    }
                  >
                    {current ? 'Sustituir archivo' : 'Adjuntar'}
                  </Button>
                </Flex>
              ) : null}
              {editable && selected[item.type] ? (
                <Typography.Paragraph
                  className="pilot-documents-selection"
                  role="status"
                >
                  Seleccionado: {selected[item.type]!.name}. Todavía no está
                  adjuntado; confirmá la carga con el botón{' '}
                  {current ? 'Sustituir archivo' : 'Adjuntar'}.
                </Typography.Paragraph>
              ) : null}
              {validation?.type === item.type ? (
                <Alert
                  id={'document-error-' + item.type}
                  type="error"
                  title={validation.message}
                  showIcon
                />
              ) : null}
              {failure && failureType === item.type ? (
                <Alert
                  type="error"
                  showIcon
                  title={errorText(failure)}
                  description={Object.values(fieldErrors(failure))
                    .flat()
                    .join(' ')}
                  action={
                    httpStatus(failure) === 409 && reload ? (
                      <Button onClick={() => setConfirmReload(true)}>
                        Recargar inscripción
                      </Button>
                    ) : undefined
                  }
                />
              ) : null}
            </div>
          );
        })}
      </div>
      <Modal
        className="pilot-documents-modal"
        open={confirmReload}
        title="Recargar expediente"
        okText="Descartar y recargar"
        cancelText="Conservar borrador"
        onCancel={() => setConfirmReload(false)}
        onOk={() => {
          setSelected({});
          selection.current = {};
          selectionCallback.current?.(false);
          setConfirmReload(false);
          reload?.();
        }}
      >
        <Typography.Paragraph>
          Se descartarán los cambios locales y archivos seleccionados, y se
          consultará la versión del servidor.
        </Typography.Paragraph>
      </Modal>
    </div>
  );
}
