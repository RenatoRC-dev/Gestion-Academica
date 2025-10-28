<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateDocenteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $docenteId = $this->route('docente');
        $personaId = \App\Models\Docente::findOrFail($docenteId)->persona_id;

        return [
            'nombre_completo' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:usuario,email,' . $docenteId,
            'ci' => 'sometimes|string|unique:persona,ci,' . $personaId,
            'telefono_contacto' => 'nullable|string|max:20',
            'direccion' => 'nullable|string|max:500',
            'codigo_docente' => 'sometimes|string|unique:docente,codigo_docente,' . $personaId . ',persona_id',
        ];
    }

    public function messages(): array
    {
        return [
            'email.unique' => 'Este email ya está registrado',
            'ci.unique' => 'Esta cédula ya está registrada',
            'codigo_docente.unique' => 'Este código de docente ya existe',
        ];
    }
}