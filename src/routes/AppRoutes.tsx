import { Route, Routes } from 'react-router-dom';
import CreditsPage from '../modules/credits/pages/CreditsPage';
import Afiliacion from '../pages/AfiliacionPlaceholder/AfiliacionPlaceholder';
import Convenios from '../pages/Convenios/Convenios';
import FPQRS from '../pages/FPQRS/FPQRS';
import Home from '../pages/Home/Home';
import MiFondo from '../pages/MiFondo/MiFondo';
import Portal from '../pages/PortalAsociadoPlaceholder/PortalAsociadoPlaceholder';
import ProductosServicios from '../pages/ProductosServicios/ProductosServicios';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/mi-fondo" element={<MiFondo />} />
      <Route path="/productos-y-servicios" element={<ProductosServicios />} />
      <Route path="/creditos" element={<CreditsPage />} />
      <Route path="/convenios" element={<Convenios />} />
      <Route path="/fpqrs" element={<FPQRS />} />
      <Route path="/afiliacion" element={<Afiliacion />} />
      <Route path="/portal-asociado" element={<Portal />} />
      <Route path="*" element={<Home />} />
    </Routes>
  );
}
