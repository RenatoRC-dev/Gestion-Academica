<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreGrupoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'codigo_grupo' => 'required|string|max:50|unique:grupo,codigo_grupo',
            'materia_id' => 'required|exists:materia,id',
            'periodo_academico_id' => 'required|exists:periodo_academico,id',
            'cupo_maximo' => 'required|integer|min:1',
            'cupo_minimo' => 'nullable|integer|min:1',
        ];
    }

    public function messages(): array
    {
        return [
            'codigo_grupo.required' => 'El código del grupo es obligatorio',
            'codigo_grupo.unique' => 'Este código de grupo ya existe',
            'materia_id.required' => 'La materia es requerida',
            'materia_id.exists' => 'La materia no existe',
            'periodo_academico_id.required' => 'El período académico es requerido',
            'periodo_academico_id.exists' => 'El período académico no existe',
            'cupo_maximo.required' => 'El cupo máximo es requerido',
            'cupo_maximo.min' => 'El cupo máximo debe ser mayor a 0',
        ];
    }
}