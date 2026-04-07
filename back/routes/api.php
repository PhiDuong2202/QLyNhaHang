<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\{
    RoleController,
    TableController,
    CategoryController,
    ProductController,
    ProductImageController,
    CustomerController,
    OrderController,
    OrderItemController,
    PaymentController,
    ReviewController,
    UserController
};
use App\Http\Controllers\AuthController;

Route::post('/login', [AuthController::class, 'login']);


Route::apiResource('categories', CategoryController::class)->only(['index','show']);
Route::apiResource('products', ProductController::class)->only(['index','show']);
Route::apiResource('product-images', ProductImageController::class)->only(['index']);

Route::apiResource('reviews', ReviewController::class)->only(['index','store']);


Route::middleware('auth:sanctum')->group(function () {

    Route::post('/logout', [AuthController::class, 'logout']);

    Route::apiResource('roles', RoleController::class);

    Route::apiResource('tables', TableController::class);

    Route::apiResource('categories', CategoryController::class)->except(['index','show']);

    Route::apiResource('products', ProductController::class)->except(['index','show']);

    Route::post('upload-image', [ProductImageController::class, 'store']);

    Route::apiResource('customers', CustomerController::class);

    Route::apiResource('orders', OrderController::class);
    Route::apiResource('order-items', OrderItemController::class);
    Route::apiResource('payments', PaymentController::class);
    Route::apiResource('users', UserController::class);
});
