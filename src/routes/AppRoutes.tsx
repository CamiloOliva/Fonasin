import { Route, Routes } from "react-router-dom";
import CreditsPage from "../modules/credits/pages/CreditsPage";
import CreditLinePage from "../modules/credits/pages/CreditLinePage";
import FonapenPage from "../modules/credits/pages/FonapenPage";
import FonaprimaPage from "../modules/credits/pages/FonaprimaPage";
import FONAROTATIVO from "../modules/credits/pages/FONAROTATIVO";
import FonaPortesPage from "../modules/credits/pages/FonaPortesPage";
import SimuladorFonasin from "../modules/credits/pages/SimuladorFonasin.jsx";
import Afiliacion from "../pages/Afiliacion/Afiliacion";
import AdminFonasin from "../pages/AdminFonasin/AdminFonasin";
import Convenios from "../pages/Convenios/Convenios";
import ConvenioEmi from "../modules/convenios/ConvenioEmi.jsx";
import ConvenioEmermedica from "../modules/convenios/ConvenioEmermedica.jsx";
import ConvenioUmaIps from "../modules/convenios/ConvenioUmaIps.jsx";
import ConvenioGrupoManejar from "../modules/convenios/ConvenioGrupoManejar.jsx";
import ConvenioPractiCar from "../modules/convenios/ConvenioPractiCar.jsx";
import ConvenioLosOlivos from "../modules/convenios/ConvenioLosOlivos.jsx";
import ConvenioSanitas from "../modules/convenios/ConvenioSanitas.jsx";
import ConvenioCapillasDeLaFe from "../modules/convenios/ConvenioCapillasDeLaFe.jsx";
import FPQRS from "../pages/FPQRS/FPQRS";
import Home from "../pages/Home/Home";
import MiFondo from "../pages/MiFondo/MiFondo";
import Estatutos from "../pages/Estatutos/Estatutos";
import Portal from "../pages/PortalAsociado/PortalAsociado";
import ProductosServicios from "../pages/ProductosServicios/ProductosServicios";
export default function AppRoutes() {
  return (
    <Routes>
      {" "}
      <Route path="/" element={<Home />} />{" "}
      <Route path="/mi-fondo" element={<MiFondo />} />{" "}
      <Route path="/productos-y-servicios" element={<ProductosServicios />} />{" "}
      <Route path="/estatutos" element={<Estatutos />} />{" "}
      <Route path="/creditos" element={<CreditsPage />} />{" "}
      <Route path="/creditos/fonapen" element={<FonapenPage />} />{" "}
      <Route path="/creditos/fonaprima" element={<FonaprimaPage />} />{" "}
      <Route path="/creditos/fonarotativo" element={<FONAROTATIVO />} />{" "}
      <Route path="/creditos/fonaportes" element={<FonaPortesPage />} />{" "}
      <Route
        path="/creditos/simulador-fonasin"
        element={<SimuladorFonasin />}
      />{" "}
      <Route path="/creditos/:slug" element={<CreditLinePage />} />{" "}
      <Route path="/convenios" element={<Convenios />} />{" "}
      <Route path="/convenios/emi" element={<ConvenioEmi />} />{" "}
      <Route path="/convenios/emermedica" element={<ConvenioEmermedica />} />{" "}
      <Route path="/convenios/uma-ips" element={<ConvenioUmaIps />} />{" "}
      <Route path="/convenios/manejar" element={<ConvenioGrupoManejar />} />{" "}
      <Route path="/convenios/practicar" element={<ConvenioPractiCar />} />{" "}
      <Route path="/convenios/los-olivos" element={<ConvenioLosOlivos />} />{" "}
      <Route path="/convenios/sanitas" element={<ConvenioSanitas />} />{" "}
      <Route
        path="/convenios/coorserpark"
        element={<ConvenioCapillasDeLaFe />}
      />{" "}
      <Route
        path="/convenios/cooserpark"
        element={<ConvenioCapillasDeLaFe />}
      />{" "}
      <Route
        path="/convenios/capillas-de-la-fe"
        element={<ConvenioCapillasDeLaFe />}
      />{" "}
      <Route path="/fpqrs" element={<FPQRS />} />{" "}
      <Route path="/afiliacion" element={<Afiliacion />} />{" "}
      <Route path="/admin-fonasin" element={<AdminFonasin />} />{" "}
      <Route path="/portal-asociado" element={<Portal />} />{" "}
      <Route path="*" element={<Home />} />{" "}
    </Routes>
  );
}
