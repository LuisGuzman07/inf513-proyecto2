import { Grid } from 'antd';
import { Link } from 'react-router-dom';
import { institutionalAssets } from './identity';

export function InstitutionalBrand() {
  const screens = Grid.useBreakpoint();
  // The horizontal wordmark needs room: below lg the header would crowd it.
  const compact = screens.lg === false;
  return (
    <Link to="/" className="pilot-brand">
      {compact ? (
        <img {...institutionalAssets.university} className="pilot-brand-mark" />
      ) : (
        <span className="pilot-brand-wordmark">
          <img {...institutionalAssets.banner} />
        </span>
      )}
      <span className="pilot-brand-copy">
        <strong>UAGRM</strong>
        <span>Administración de Empresas</span>
      </span>
    </Link>
  );
}

export function InstitutionalPresentation() {
  return (
    <div className="pilot-institution">
      <img
        {...institutionalAssets.banner}
        className="pilot-institution-banner"
      />
      <div className="pilot-career">
        <img {...institutionalAssets.career} className="pilot-career-logo" />
        <span>Carrera de Administración de Empresas</span>
      </div>
    </div>
  );
}

export function InstitutionalPhoto() {
  return (
    <figure className="pilot-institution-photo">
      <img {...institutionalAssets.building} />
      <figcaption>UAGRM · Administración de Empresas</figcaption>
    </figure>
  );
}
