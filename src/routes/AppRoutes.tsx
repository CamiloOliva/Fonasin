import { Route, Routes } from 'react-router-dom';
import CreditsPage from '../modules/credits/pages/CreditsPage';
import CreditLinePage from '../modules/credits/pages/CreditLinePage';
import FonapenPage from '../modules/credits/pages/FonapenPage';
import FonaprimaPage from '../modules/credits/pages/FonaprimaPage';
import FONAROTATIVO from '../modules/credits/pages/FONAROTATIVO';
import FonaPortesPage from '../modules/credits/pages/FonaPortesPage';
import SimuladorFonasin from '../modules/credits/pages/SimuladorFonasin.jsx';
import Afiliacion from '../pages/AfiliacionPlaceholder/AfiliacionPlaceholder';
import Convenios from '../pages/Convenios/Convenios';
import FPQRS from '../pages/FPQRS/FPQRS';
import Home from '../pages/Home/Home';
import MiFondo from '../pages/MiFondo/MiFondo';
import Estatutos from '../pages/Estatutos/Estatutos';
import Portal from '../pages/PortalAsociadoPlaceholder/PortalAsociadoPlaceholder';
import ProductosServicios from '../pages/ProductosServicios/ProductosServicios';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/mi-fondo" element={<MiFondo />} />
      <Route path="/productos-y-servicios" element={<ProductosServicios />} />
      <Route path="/estatutos" element={<Estatutos />} />
      <Route path="/creditos" element={<CreditsPage />} />
      <Route path="/creditos/fonapen" element={<FonapenPage />} />
      <Route path="/creditos/fonaprima" element={<FonaprimaPage />} />
      <Route path="/creditos/fonarotativo" element={<FONAROTATIVO />} />
      <Route path="/creditos/fonaportes" element={<FonaPortesPage />} />
      <Route path="/creditos/simulador-fonasin" element={<SimuladorFonasin />} />
      <Route path="/creditos/:slug" element={<CreditLinePage />} />
      <Route path="/convenios" element={<Convenios />} />
      <Route path="/fpqrs" element={<FPQRS />} />
      <Route path="/afiliacion" element={<Afiliacion />} />
      <Route path="/portal-asociado" element={<Portal />} />
      <Route path="*" element={<Home />} />
    </Routes>
  );
}
