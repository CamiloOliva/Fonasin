<p>Se recibio una nueva FPQRS en FONASIN.</p>

<ul>
    <li><strong>ID:</strong> {{ $submission->id }}</li>
    <li><strong>Tipo:</strong> {{ $submission->submission_type }}</li>
    <li><strong>Nombre:</strong> {{ $submission->full_name }}</li>
    <li><strong>Correo:</strong> {{ $submission->email }}</li>
    <li><strong>Fecha:</strong> {{ $submission->submitted_at?->toDateTimeString() }}</li>
    <li><strong>Adjunto privado:</strong> {{ $submission->attachment_storage_key ? 'Si' : 'No' }}</li>
</ul>

<p><strong>Mensaje:</strong></p>
<p>{{ $submission->message }}</p>

@if ($submission->attachment_storage_key)
    <p>El adjunto fue almacenado en el storage privado. No se adjunta al correo para evitar copias no controladas.</p>
@endif
