<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Role;
use Illuminate\Http\Request;

class RoleController extends Controller
{
    public function index()
    {
        return response()->json(Role::all());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:100'
        ]);

        return Role::create($data);
    }

    public function show($id)
    {
        return Role::findOrFail($id);
    }

    public function update(Request $request, $id)
    {
        $role = Role::findOrFail($id);

        $data = $request->validate([
            'name' => 'required|string|max:100'
        ]);

        $role->update($data);
        return $role;
    }

    public function destroy($id)
    {
        Role::destroy($id);
        return response()->json(['message' => 'Deleted']);
    }
}
