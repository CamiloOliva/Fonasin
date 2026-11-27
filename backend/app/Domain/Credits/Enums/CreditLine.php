<?php

namespace App\Domain\Credits\Enums;

enum CreditLine: string
{
    case Fonalibre = 'FONALIBRE';
    case Fonapen = 'FONAPEN';
    case Fonaprima = 'FONAPRIMA';
    case Fonarotativo = 'FONAROTATIVO';
    case Fonaportes = 'FONAPORTES';
    case Convenios = 'CONVENIOS';
    case Credirapido = 'CREDIRAPIDO';
    case LibreInversion = 'LIBRE INVERSION';
    case Aportes = 'APORTES';
}
