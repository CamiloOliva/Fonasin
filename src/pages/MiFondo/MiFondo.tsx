import React from 'react';
import { 
  Users, 
  PiggyBank, 
  Calendar, 
  ShieldCheck, 
  FileText, 
  Gift, 
  Cake, 
  Heart, 
  Plane, 
  Sparkles,
  ChevronRight
} from 'lucide-react';
import styles from '../../modules/credits/styles/MiFondo.module.css';

export const MiFondo: React.FC = () => {
  return (
    <div className={styles.container}>
      
      {/* SECCIÓN: AHORRO PERMANENTE */}
      <section className={styles.cardPermanente}>
        <div className={styles.contentCol}>
          <div>
            <h1 className={styles.title}>
              AHORRO <br />
              <span className={styles.titleAccent}>PERMANENTE</span>
            </h1>
            <p className={styles.subtitle}>
              Un ahorro que construyes <span className={styles.subtitleAccent}>desde tu afiliación</span>
            </p>
            <p className={styles.description}>
              Al ser asociado de FONASIN, se destina el{' '}
              <span className={styles.badgeHighlight}>1,5%</span> de tu salario al ahorro y aportes,
              distribuido de la siguiente manera:
            </p>
          </div>

          <div className={styles.calloutBox}>
            <ShieldCheck size={32} className={styles.calloutIcon} />
            <span className={styles.calloutText}>
              Tu ahorro es parte de tu bienestar y crecimiento como asociado <strong style={{ color: '#F2B814' }}>FONASIN</strong>.
            </span>
          </div>
        </div>

        <div className={styles.statsCol}>
          <div className={styles.statRow}>
            <div className={styles.statIconContainer}>
              <Users size={24} />
            </div>
            <div>
              <div>
                <span className={styles.statValue}>70%</span>
                <span className={styles.statLabelTitle}>APORTES SOCIALES</span>
              </div>
              <span className={styles.statLabelSub}>Fortalecemos nuestro Fondo juntos.</span>
            </div>
          </div>

          <div className={styles.statRow}>
            <div className={styles.statIconContainer}>
              <PiggyBank size={24} />
            </div>
            <div>
              <div>
                <span className={styles.statValue}>30%</span>
                <span className={styles.statLabelTitle}>AHORRO PERMANENTE</span>
              </div>
              <span className={styles.statLabelSub}>Construyes un respaldo para tu futuro.</span>
            </div>
          </div>

          <div className={styles.statRow}>
            <div className={styles.statIconContainer}>
              <Calendar size={24} />
            </div>
            <div>
              <span className={styles.statLabelSub}>
                Del ahorro permanente, podrás retirar máximo el{' '}
                <strong style={{ color: '#F2B814', fontSize: '1.1rem' }}>20% anual</strong>{' '}
                de acuerdo con las condiciones del Fondo.
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* SECCIÓN: AHORROS VOLUNTARIOS */}
      <section className={styles.cardVoluntarios}>
        <div className={styles.leftVoluntarios}>
          <div>
            <h2 className={styles.title}>
              AHORROS <br />
              <span className={styles.titleAccent}>VOLUNTARIOS</span>
            </h2>
            <p className={styles.subtitle}>Ahorra hoy, disfruta mañana</p>
            <p className={styles.description}>
              Como asociado de FONASIN también puedes realizar{' '}
              <strong style={{ color: '#F2B814' }}>ahorros voluntarios</strong>, definiendo el valor que deseas ahorrar mensualmente.
            </p>
          </div>

          <div>
            <div className={styles.calloutBox} style={{ borderColor: '#7246A8', background: 'rgba(84, 41, 138, 0.2)' }}>
              <FileText size={28} style={{ color: '#7246A8', flexShrink: 0 }} />
              <span className={styles.calloutText} style={{ fontSize: '0.8rem' }}>
                Para comenzar, solo debes realizar la <strong>autorización</strong> correspondiente a través de nuestro formulario.
              </span>
            </div>

            <button className={styles.btnPrimary}>
              <span>Quiero realizar un ahorro voluntario</span>
              <div className={styles.btnIcon}>
                <ChevronRight size={18} />
              </div>
            </button>
          </div>
        </div>

        <div className={styles.rightVoluntarios}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>
              Tus sueños, <span style={{ color: '#F2B814' }}>nuestras soluciones</span>
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#E8E8E8', marginTop: '4px' }}>
              Usa tus ahorros voluntarios para lo que más te importa:
            </p>

            <div className={styles.categoryGrid}>
              <div className={styles.categoryCard}>
                <div className={styles.categoryIcon}><Gift size={22} /></div>
                <span className={styles.categoryTitle}>Navidad</span>
                <span className={styles.categoryDesc}>Prepárate para vivir una Navidad inolvidable.</span>
              </div>

              <div className={styles.categoryCard}>
                <div className={styles.categoryIcon}><Cake size={22} /></div>
                <span className={styles.categoryTitle}>Cumpleaños</span>
                <span className={styles.categoryDesc}>Celebra momentos especiales sin preocupaciones.</span>
              </div>

              <div className={styles.categoryCard}>
                <div className={styles.categoryIcon}><Heart size={22} /></div>
                <span className={styles.categoryTitle}>Aniversarios</span>
                <span className={styles.categoryDesc}>Conmemora tu historia de amor con detalles.</span>
              </div>

              <div className={styles.categoryCard}>
                <div className={styles.categoryIcon}><Plane size={22} /></div>
                <span className={styles.categoryTitle}>Viajes</span>
                <span className={styles.categoryDesc}>Descubre nuevos lugares y crea recuerdos.</span>
              </div>

              <div className={styles.categoryCard}>
                <div className={styles.categoryIcon}><Sparkles size={22} /></div>
                <span className={styles.categoryTitle}>Y mucho más</span>
                <span className={styles.categoryDesc}>Metas, proyectos e imprevistos.</span>
              </div>
            </div>
          </div>

          <p className={styles.handwrittenText}>
            Tú decides cuánto ahorrar, nosotros te ayudamos a lograrlo.
          </p>
        </div>
      </section>

    </div>
  );
};

export default MiFondo;