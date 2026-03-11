import React, { useState, useRef } from 'react';
import { Upload, X, FileText, Image, Plus } from 'lucide-react';
import { PHOTO_CATEGORIES } from '../utils/constants.js';
import { useApp } from '../context/AppContext.jsx';

function PhotoThumb({ photo, onRemove }) {
  const isPdf = photo.type === 'pdf';
  return (
    <div className="relative group rounded-xl overflow-hidden bg-slate-100 aspect-square">
      {isPdf ? (
        <div className="w-full h-full flex flex-col items-center justify-center gap-1 p-2">
          <FileText className="w-8 h-8 text-red-400" />
          <span className="text-xs text-slate-500 text-center leading-tight truncate w-full px-1">{photo.name}</span>
        </div>
      ) : (
        <img
          src={photo.data}
          alt={photo.name}
          className="w-full h-full object-cover"
        />
      )}
      {/* Category badge */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-1.5 py-1">
        <p className="text-white text-xs truncate leading-tight">{photo.category}</p>
      </div>
      {/* Remove button */}
      <button
        onClick={() => onRemove(photo.id)}
        className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}

export default function PhotoUpload({ orderId }) {
  const { getOrder, addPhoto, removePhoto, showToast } = useApp();
  const order = getOrder(orderId);
  const [category, setCategory] = useState(PHOTO_CATEGORIES[0]);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  const photos = order?.photos || [];

  const handleFiles = async (files) => {
    setUploading(true);
    const arr = Array.from(files);
    for (const file of arr) {
      const isImage = file.type.startsWith('image/');
      const isPdf   = file.type === 'application/pdf';
      if (!isImage && !isPdf) {
        showToast(`Неподдерживаемый формат: ${file.name}`, 'error');
        continue;
      }
      if (file.size > 10 * 1024 * 1024) {
        showToast(`Файл слишком большой (макс 10 МБ): ${file.name}`, 'error');
        continue;
      }
      const data = await readFileBase64(file);
      addPhoto(orderId, {
        id: 'ph-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
        category,
        name: file.name,
        type: isImage ? 'image' : 'pdf',
        data,
        created_at: new Date().toISOString(),
      });
    }
    setUploading(false);
    showToast(`Загружено ${arr.length} файл${arr.length > 1 ? 'а' : ''}`);
  };

  const readFileBase64 = (file) =>
    new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.readAsDataURL(file);
    });

  const handleDrop = (e) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  // Group photos by category
  const grouped = PHOTO_CATEGORIES.reduce((acc, cat) => {
    acc[cat] = photos.filter(p => p.category === cat);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {/* Upload area */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className="border-2 border-dashed border-slate-200 rounded-xl p-5 text-center hover:border-brand-400 hover:bg-brand-50/30 transition-colors cursor-pointer"
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*,.pdf"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <Upload className="w-8 h-8 text-slate-300 mx-auto mb-2" />
        <p className="text-sm font-medium text-slate-600">Перетащите файлы или нажмите для выбора</p>
        <p className="text-xs text-slate-400 mt-1">JPG, PNG, PDF — до 10 МБ каждый</p>
      </div>

      {/* Category + upload button */}
      <div className="flex items-center gap-2">
        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          className="input flex-1 text-sm"
          onClick={(e) => e.stopPropagation()}
        >
          {PHOTO_CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="btn-primary flex items-center gap-1.5 text-sm flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          {uploading ? 'Загрузка...' : 'Добавить'}
        </button>
      </div>

      {/* Photos grouped by category */}
      {photos.length > 0 ? (
        <div className="space-y-4">
          {PHOTO_CATEGORIES.map(cat => {
            const catPhotos = grouped[cat];
            if (!catPhotos.length) return null;
            return (
              <div key={cat}>
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <span className="w-1 h-3 bg-brand-500 rounded-full inline-block" />
                  {cat} <span className="text-slate-400 normal-case font-normal">({catPhotos.length})</span>
                </h4>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {catPhotos.map(photo => (
                    <PhotoThumb key={photo.id} photo={photo} onRemove={(pid) => removePhoto(orderId, pid)} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center py-6 text-slate-400">
          <Image className="w-10 h-10 mb-2 text-slate-200" />
          <p className="text-sm">Нет прикреплённых файлов</p>
        </div>
      )}
    </div>
  );
}
