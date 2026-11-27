<p>Hola,</p>

<p>FONASIN preparo tu acceso al portal de asociados.</p>

<p><a href="{{ $activationUrl }}">Activar acceso y definir contrasena</a></p>

<p>Este enlace vence en {{ $expiresInMinutes % 60 === 0 ? ($expiresInMinutes / 60).' hora'.($expiresInMinutes === 60 ? '' : 's') : $expiresInMinutes.' minutos' }} y solo puede utilizarse para tu cuenta.</p>

<p>Despues de ingresar deberas completar tu informacion personal en el formulario protegido.</p>

<p>Si no reconoces este mensaje, comunicate con FONASIN y no abras el enlace.</p>
