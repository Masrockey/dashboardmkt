<?php

use App\Enums\UserRole;
use App\Models\Category;
use App\Models\Segment;
use App\Models\Series;
use App\Models\Type;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Inertia\Testing\AssertableInertia;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

test('guests are redirected to the login page when visiting types', function () {
    $response = $this->get(route('types.index'));

    $response->assertRedirect(route('login'));
});

test('unauthorized users cannot access types', function () {
    $user = User::factory()->create(['role' => UserRole::Dealer]);

    $response = $this->actingAs($user)->get(route('types.index'));

    $response->assertStatus(403);
});

test('superadmin or spv users can view the types page', function () {
    $user = User::factory()->create(['role' => UserRole::Superadmin]);

    $response = $this->actingAs($user)->get(route('types.index'));

    $response->assertOk();
});

test('authorized users can create a type', function () {
    $user = User::factory()->create(['role' => UserRole::Spv]);
    $segment = Segment::create(['nama_segment' => 'AT HIGH']);
    $category = Category::create(['nama_kategori' => 'HONDA']);

    $response = $this->actingAs($user)->post(route('types.store'), [
        'nama_type' => 'VARIO 160',
        'category_id' => $category->id,
        'segment_id' => $segment->id,
        'nama_pasar' => 'VARIO 160 CBS',
    ]);

    $response->assertRedirect(route('types.index'));

    $this->assertDatabaseHas('types', [
        'nama_type' => 'VARIO 160',
        'category_id' => $category->id,
        'segment_id' => $segment->id,
        'nama_pasar' => 'VARIO 160 CBS',
    ]);
});

test('authorized users can update a type', function () {
    $user = User::factory()->create(['role' => UserRole::Superadmin]);
    $category1 = Category::create(['nama_kategori' => 'HONDA']);
    $category2 = Category::create(['nama_kategori' => 'YAMAHA']);
    $segment1 = Segment::create(['nama_segment' => 'AT HIGH']);
    $segment2 = Segment::create(['nama_segment' => 'AT MID']);
    $type = Type::create([
        'nama_type' => 'VARIO 160',
        'category_id' => $category1->id,
        'segment_id' => $segment1->id,
        'nama_pasar' => 'VARIO 160 CBS',
    ]);

    $response = $this->actingAs($user)->put(route('types.update', $type), [
        'nama_type' => 'BEAT FI',
        'category_id' => $category2->id,
        'segment_id' => $segment2->id,
        'nama_pasar' => 'BEAT SPORTY CBS',
    ]);

    $response->assertRedirect(route('types.index'));

    $this->assertDatabaseHas('types', [
        'id' => $type->id,
        'nama_type' => 'BEAT FI',
        'category_id' => $category2->id,
        'segment_id' => $segment2->id,
        'nama_pasar' => 'BEAT SPORTY CBS',
    ]);
});

test('authorized users can delete a type', function () {
    $user = User::factory()->create(['role' => UserRole::Superadmin]);
    $type = Type::create(['nama_type' => 'VARIO 160']);

    $response = $this->actingAs($user)->delete(route('types.destroy', $type));

    $response->assertRedirect(route('types.index'));

    $this->assertDatabaseMissing('types', [
        'id' => $type->id,
    ]);
});

test('authorized users can create and update a type with series relation', function () {
    $user = User::factory()->create(['role' => UserRole::Superadmin]);
    $series1 = Series::create(['nama' => 'Vario Series']);
    $series2 = Series::create(['nama' => 'BeAT Series']);

    $response = $this->actingAs($user)->post(route('types.store'), [
        'nama_type' => 'VARIO 160',
        'series_id' => $series1->id,
        'nama_pasar' => 'VARIO 160 CBS',
    ]);

    $response->assertRedirect(route('types.index'));

    $this->assertDatabaseHas('types', [
        'nama_type' => 'VARIO 160',
        'series_id' => $series1->id,
    ]);

    $type = Type::where('nama_type', 'VARIO 160')->first();
    expect($type->series->id)->toBe($series1->id);

    // Update series
    $response = $this->actingAs($user)->put(route('types.update', $type), [
        'nama_type' => 'VARIO 160',
        'series_id' => $series2->id,
    ]);

    $response->assertRedirect(route('types.index'));

    $this->assertDatabaseHas('types', [
        'id' => $type->id,
        'series_id' => $series2->id,
    ]);
});

test('types can be searched by series name', function () {
    $user = User::factory()->create(['role' => UserRole::Superadmin]);
    $series = Series::create(['nama' => 'Scoopy Series']);
    Type::create([
        'nama_type' => 'SCOOPY PRESTIGE',
        'series_id' => $series->id,
    ]);
    Type::create([
        'nama_type' => 'CBR 250RR',
    ]);

    $response = $this->actingAs($user)->get(route('types.index', ['search' => 'Scoopy']));

    $response->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('types/index')
            ->where('types.total', 1)
            ->where('types.data.0.nama_type', 'SCOOPY PRESTIGE')
        );
});

test('authorized users can export types to excel', function () {
    $user = User::factory()->create(['role' => UserRole::Superadmin]);
    Type::create(['nama_type' => 'VARIO 160']);

    $response = $this->actingAs($user)->get(route('types.export'));

    $response->assertOk();
    $response->assertHeader('content-type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
});

test('authorized users can download import template', function () {
    $user = User::factory()->create(['role' => UserRole::Superadmin]);

    $response = $this->actingAs($user)->get(route('types.template'));

    $response->assertOk();
    $response->assertHeader('content-type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
});

test('authorized users can import types from csv file', function () {
    $user = User::factory()->create(['role' => UserRole::Superadmin]);

    $csvContent = "TYPE,KATEGORI,SEGMENT,SERIES,NAMA PASAR\n";
    $csvContent .= "PCX 160,HONDA,AT HIGH,PCX Series,PCX 160 CBS\n";
    $csvContent .= "AEROX 155,YAMAHA,AT HIGH,MAXI Series,AEROX CONNECTED\n";

    $file = UploadedFile::fake()->createWithContent('types.csv', $csvContent);

    $response = $this->actingAs($user)->post(route('types.import'), [
        'file' => $file,
    ]);

    $response->assertRedirect(route('types.index'));

    $this->assertDatabaseHas('types', [
        'nama_type' => 'PCX 160',
        'nama_pasar' => 'PCX 160 CBS',
    ]);
    $this->assertDatabaseHas('categories', [
        'nama_kategori' => 'HONDA',
    ]);
    $this->assertDatabaseHas('segments', [
        'nama_segment' => 'AT HIGH',
    ]);
    $this->assertDatabaseHas('series', [
        'nama' => 'PCX Series',
    ]);
});

test('authorized users can import types from real xlsx file', function () {
    $user = User::factory()->create(['role' => UserRole::Superadmin]);

    $spreadsheet = new Spreadsheet;
    $sheet = $spreadsheet->getActiveSheet();
    $sheet->setCellValue('A1', 'TYPE');
    $sheet->setCellValue('B1', 'KATEGORI');
    $sheet->setCellValue('C1', 'SEGMENT');
    $sheet->setCellValue('D1', 'SERIES');
    $sheet->setCellValue('E1', 'NAMA PASAR');

    $sheet->setCellValue('A2', 'ADV 160');
    $sheet->setCellValue('B2', 'HONDA');
    $sheet->setCellValue('C2', 'AT HIGH');
    $sheet->setCellValue('D2', 'ADV Series');
    $sheet->setCellValue('E2', 'ADV 160 ABS');

    $tempFile = tempnam(sys_get_temp_dir(), 'test_type_').'.xlsx';
    $writer = new Xlsx($spreadsheet);
    $writer->save($tempFile);

    $file = new UploadedFile($tempFile, 'types.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', null, true);

    $response = $this->actingAs($user)->post(route('types.import'), [
        'file' => $file,
    ]);

    $response->assertRedirect(route('types.index'));

    $this->assertDatabaseHas('types', [
        'nama_type' => 'ADV 160',
        'nama_pasar' => 'ADV 160 ABS',
    ]);
    $this->assertDatabaseHas('series', [
        'nama' => 'ADV Series',
    ]);

    @unlink($tempFile);
});
