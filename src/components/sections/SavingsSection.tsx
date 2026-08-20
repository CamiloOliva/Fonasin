import BenefitCard from '../cards/BenefitCard';
import SectionHeading from '../ui/SectionHeading';

export default function SavingsSection() {
  return (
    <section className="py-16">
      <div className="container-page">
        <SectionHeading
          eyebrow="Ahorros"
          title="Opciones para construir tus metas"
          text="Consulta una visión general de esta línea y accede a la vista dedicada para conocer sus detalles."
          center
        />

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <BenefitCard title="Planeación de metas" accent="green">
            <p>
              Un espacio pensado para acompañar tus proyectos personales, familiares y de largo plazo.
            </p>
          </BenefitCard>

          <BenefitCard title="Más detalles en la vista dedicada" accent="lime">
            <p>
              Allí encontrarás la información específica de esta línea, con las condiciones y opciones
              disponibles.
            </p>
          </BenefitCard>
        </div>
      </div>
    </section>
  );
}
