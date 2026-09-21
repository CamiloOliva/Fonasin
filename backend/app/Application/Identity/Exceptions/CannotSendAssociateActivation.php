<?php

namespace App\Application\Identity\Exceptions;

use DomainException;

class CannotSendAssociateActivation extends DomainException
{
    public static function unavailable(): self
    {
        return new self('El asociado no tiene una cuenta activa disponible para enviar la activacion.');
    }
}
