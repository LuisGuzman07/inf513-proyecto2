import { Alert, Flex, Tag } from 'antd';
import { PageHeader } from '../components/shared/page-header/page-header';
import type { ReactNode } from 'react';
import type { RecordStatus } from './types';
import { statusLabels } from './workflow';

export function StatusTag({ status }: { status?: RecordStatus }) {
  const color =
    status === 'correction_requested'
      ? 'warning'
      : status === 'submitted' || status === 'in_review'
        ? 'processing'
        : 'default';
  return (
    <Tag color={color} variant="filled">
      {status ? statusLabels[status] : 'Estado no disponible'}
    </Tag>
  );
}

export function PageIntro({
  title,
  description,
  status,
  extra,
}: {
  title: string;
  description: string;
  status?: RecordStatus;
  extra?: ReactNode;
}) {
  return (
    <PageHeader
      title={title}
      description={description}
      headingLevel={1}
      divider={false}
      preserveCase
      titleClassName="pilot-page-title"
      className="pilot-page-intro"
      extra={
        <Flex gap={8} align="center" wrap>
          {status ? <StatusTag status={status} /> : null}
          {extra}
        </Flex>
      }
    />
  );
}

const graduateNextAction: Record<RecordStatus, string> = {
  draft:
    'Completá tus datos y documentos. Podés guardar un borrador y enviarlo cuando esté listo.',
  submitted:
    'Tu inscripción fue enviada. Podés consultar tus documentos mientras esperás la revisión.',
  in_review:
    'El personal está revisando tu inscripción. Podés consultar los datos y documentos enviados.',
  correction_requested:
    'Revisá las observaciones del personal, guardá tus correcciones y reenviá la inscripción.',
  review_concluded:
    'La revisión documental concluyó. El personal continúa con la revisión académica.',
  legacy_internal:
    'Este expediente anterior tiene la vinculación de titular pendiente. Podés consultarlo sin modificarlo.',
};
const staffNextAction: Record<RecordStatus, string> = {
  ...graduateNextAction,
  submitted:
    'Tomá la revisión para registrar observaciones o solicitar una corrección.',
  in_review:
    'Revisá los datos y documentos. Registrá una observación o solicitá corrección si corresponde.',
  correction_requested:
    'El titular debe atender las observaciones y reenviar la inscripción.',
  review_concluded:
    'Revisión documental concluida. Podés registrar las revisiones académica y de CV.',
};

export function NextAction({
  status,
  staff = false,
  observationsCount = 0,
}: {
  status: RecordStatus;
  staff?: boolean;
  observationsCount?: number;
}) {
  const nextAction = (staff ? staffNextAction : graduateNextAction)[status];
  const observationNoun =
    observationsCount === 1 ? 'observación' : 'observaciones';
  const description =
    !staff && observationsCount > 0
      ? status === 'correction_requested'
        ? nextAction +
          ` Hay ${observationsCount} ${observationNoun} registrada${
            observationsCount === 1 ? '' : 's'
          } en la sección Observaciones.`
        : nextAction +
          ` Hay ${observationsCount} ${observationNoun} del personal; revisala${
            observationsCount === 1 ? '' : 's'
          } en la sección Observaciones.`
      : nextAction;
  return (
    <Alert
      className="pilot-next-action"
      type={status === 'correction_requested' ? 'warning' : 'info'}
      title="Próxima acción"
      description={description}
      showIcon
    />
  );
}
