import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRestaurantData } from '../utils/auth';
import { getPlaceBySlug, updatePlace, getAllTags, replacePlaceTags, createTag, uploadLogo, deleteLogo, uploadPhoto, deletePhoto, type Tag } from '../services/api';
import type { Place } from '../types/place';
import './EditRestaurant.css';

function EditRestaurant() {
  const navigate = useNavigate();
  const restaurantData = getRestaurantData();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [place, setPlace] = useState<Place | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_published: false,
    whatsapp_phone: '',
    email: '',
    city: '',
    address: '',
    availability: true,
    available_count: 0,
  });
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);
  const [creatingTag, setCreatingTag] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [deletingLogo, setDeletingLogo] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [deletingPhotoUrl, setDeletingPhotoUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Mantener selectedTags sincronizado con selectedTagIds
  useEffect(() => {
    if (selectedTagIds.length === 0) {
      setSelectedTags([]);
      return;
    }
    
    const tags = availableTags.filter(tag => selectedTagIds.includes(tag.id));
    
    // Eliminar duplicados por ID
    const uniqueTags = tags.filter((tag, index, self) => 
      index === self.findIndex(t => t.id === tag.id)
    );
    
    setSelectedTags(uniqueTags);
  }, [selectedTagIds, availableTags]);

  useEffect(() => {
    if (!restaurantData) {
      setError('No se encontró información del restaurante');
      setLoading(false);
      return;
    }

    // Si no hay slug, intentar usar el place_id o mostrar error
    const slug = restaurantData.slug;
    if (!slug) {
      setError('No se encontró el slug del restaurante. Por favor, cierra sesión y vuelve a iniciar.');
      setLoading(false);
      return;
    }

    loadPlace();
    loadTags();
  }, []);

  const loadTags = async () => {
    try {
      const tags = await getAllTags();
      const activeTags = tags.filter(t => t.is_active);
      
      // Preservar los tags que ya están en availableTags (pueden ser tags del restaurante)
      setAvailableTags(prev => {
        const existingTagIds = new Set(prev.map(t => t.id));
        const newTags = activeTags.filter(t => !existingTagIds.has(t.id));
        return [...prev, ...newTags];
      });
    } catch (err) {
      console.error('Error loading tags:', err);
    }
  };
  
  // Asegurar que los tags del restaurante estén en availableTags
  useEffect(() => {
    if (selectedTags.length > 0 && availableTags.length > 0) {
      const missingTags = selectedTags.filter(
        selectedTag => !availableTags.some(availableTag => availableTag.id === selectedTag.id)
      );
      if (missingTags.length > 0) {
        console.log('Adding missing tags to availableTags:', missingTags);
        setAvailableTags(prev => {
          const newTags = [...prev];
          missingTags.forEach(tag => {
            if (!newTags.some(t => t.id === tag.id)) {
              newTags.push(tag);
            }
          });
          return newTags;
        });
      }
    }
  }, [selectedTags, availableTags]);

  const handleTagToggle = (tagId: string) => {
    setSelectedTagIds(prev => {
      if (prev.includes(tagId)) {
        // Remover el tag
        return prev.filter(id => id !== tagId);
      } else {
        // Agregar el tag solo si no está ya seleccionado
        if (prev.includes(tagId)) {
          return prev;
        }
        return [...prev, tagId];
      }
    });
    setHasChanges(true);
    setSuccess(false);
  };

  const handleRemoveTag = (tagId: string) => {
    setSelectedTagIds(prev => prev.filter(id => id !== tagId));
    setHasChanges(true);
    setSuccess(false);
  };

  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleCreateTag = async () => {
    if (!newTagInput.trim()) return;

    const tagName = newTagInput.trim();
    const tagSlug = generateSlug(tagName);

    // Verificar si el tag ya existe
    const existingTag = availableTags.find(t => 
      t.slug === tagSlug || t.name.toLowerCase() === tagName.toLowerCase()
    );

    if (existingTag) {
      // Si existe, solo seleccionarlo
      if (!selectedTagIds.includes(existingTag.id)) {
        handleTagToggle(existingTag.id);
      }
      setNewTagInput('');
      setShowTagInput(false);
      return;
    }

    try {
      setCreatingTag(true);
      const newTag = await createTag({
        name: tagName,
        slug: tagSlug,
      });

      // Agregar a la lista de tags disponibles solo si no existe
      setAvailableTags(prev => {
        if (prev.some(t => t.id === newTag.id)) {
          return prev;
        }
        return [...prev, newTag];
      });
      
      // Seleccionar el nuevo tag solo si no está ya seleccionado
      setSelectedTagIds(prev => {
        if (prev.includes(newTag.id)) {
          return prev;
        }
        return [...prev, newTag.id];
      });
      // selectedTags se actualizará automáticamente por el useEffect
      
      setNewTagInput('');
      setShowTagInput(false);
      setHasChanges(true);
      setSuccess(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear el tag');
    } finally {
      setCreatingTag(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCreateTag();
    } else if (e.key === 'Escape') {
      setShowTagInput(false);
      setNewTagInput('');
    }
  };

  const loadPlace = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getPlaceBySlug(restaurantData!.slug!);
      
      if (response.ok && response.data) {
        const placeData = response.data;
        console.log('[EditRestaurant] Place data loaded:', {
          slug: placeData.slug,
          logo_url: placeData.logo_url,
          place_media_count: placeData.place_media?.length || 0,
          place_media: placeData.place_media
        });
        setPlace(placeData);

        const location = Array.isArray(placeData.place_location) 
          ? placeData.place_location[0] 
          : placeData.place_location;
        
        const contact = Array.isArray(placeData.place_contact)
          ? placeData.place_contact[0]
          : placeData.place_contact;

        const capacity = Array.isArray(placeData.place_capacity)
          ? placeData.place_capacity[0]
          : placeData.place_capacity;

        setFormData({
          name: placeData.name || '',
          description: placeData.description || '',
          is_published: placeData.is_published ?? false,
          whatsapp_phone: contact?.whatsapp_phone || '',
          email: contact?.email || '',
          city: location?.city || '',
          address: location?.address || '',
          availability: capacity?.availability === true || (typeof capacity?.availability === 'string' && (capacity.availability === 'true' || capacity.availability === 'AVAILABLE' || capacity.availability === 'available')),
          available_count: capacity?.available_count || 0,
        });

        // Cargar tags del restaurante
        const placeTags = placeData.place_tags || [];
        console.log('Place tags raw:', placeTags);
        
        const tags = placeTags
          .map(pt => {
            // Manejar diferentes estructuras posibles
            if (pt.tags) {
              return pt.tags;
            }
            return null;
          })
          .filter((tag): tag is Tag => tag !== null && tag !== undefined);
        
        console.log('Processed tags:', tags);
        
        // Eliminar duplicados por ID
        const uniqueTags = tags.filter((tag, index, self) => 
          index === self.findIndex(t => t.id === tag.id)
        );
        
        // Agregar los tags del restaurante a availableTags si no están presentes
        setAvailableTags(prev => {
          const newTags = [...prev];
          uniqueTags.forEach(tag => {
            if (!newTags.some(t => t.id === tag.id)) {
              newTags.push(tag);
            }
          });
          return newTags;
        });
        
        const tagIds = uniqueTags.map(tag => tag.id);
        console.log('Selected tag IDs:', tagIds);
        setSelectedTagIds(tagIds);
        // selectedTags se actualizará automáticamente por el useEffect
      } else {
        setError(response.error || 'Error al cargar los datos del restaurante');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !place) return;

    // Validar tipo de archivo
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      setError('Tipo de archivo no permitido. Solo se permiten imágenes (PNG, JPEG, WEBP, SVG)');
      return;
    }

    // Validar tamaño (máximo 2MB)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      setError('El archivo es demasiado grande. Máximo 2MB');
      return;
    }

    try {
      setUploadingLogo(true);
      setError('');
      const result = await uploadLogo(place.id, file);
      
      if (result.ok && result.logo_url) {
        // Actualizar el place con el nuevo logo_url
        setPlace(prev => prev ? { ...prev, logo_url: result.logo_url } : null);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(result.error || 'Error al subir el logo');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir el logo');
    } finally {
      setUploadingLogo(false);
      // Limpiar el input para permitir subir el mismo archivo de nuevo
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleLogoDelete = async () => {
    if (!place || !place.logo_url) return;

    if (!confirm('¿Estás seguro de que deseas eliminar el logo?')) {
      return;
    }

    try {
      setDeletingLogo(true);
      setError('');
      const result = await deleteLogo(place.id);
      
      if (result.ok) {
        // Actualizar el place eliminando el logo_url
        setPlace(prev => prev ? { ...prev, logo_url: undefined } : null);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(result.error || 'Error al eliminar el logo');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar el logo');
    } finally {
      setDeletingLogo(false);
    }
  };

  const handlePhotoUploadClick = () => {
    photoInputRef.current?.click();
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !place) return;

    // Validar tipo de archivo
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Tipo de archivo no permitido. Solo se permiten imágenes (PNG, JPEG, WEBP)');
      return;
    }

    // Validar tamaño (máximo 5MB para fotos)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setError('El archivo es demasiado grande. Máximo 5MB');
      return;
    }

    try {
      setUploadingPhoto(true);
      setError('');
      const result = await uploadPhoto(place.slug, file, false);
      
      if (result.ok && result.url) {
        // Recargar el lugar para obtener las fotos actualizadas
        await loadPlace();
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(result.error || 'Error al subir la foto');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir la foto');
    } finally {
      setUploadingPhoto(false);
      // Limpiar el input
      if (photoInputRef.current) {
        photoInputRef.current.value = '';
      }
    }
  };

  const handlePhotoDelete = async (photoUrl: string) => {
    if (!place) return;

    if (!confirm('¿Estás seguro de que deseas eliminar esta foto?')) {
      return;
    }

    try {
      setDeletingPhotoUrl(photoUrl);
      setError('');
      const result = await deletePhoto(place.slug, photoUrl);
      
      if (result.ok) {
        // Recargar el lugar para obtener las fotos actualizadas
        await loadPlace();
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(result.error || 'Error al eliminar la foto');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar la foto');
    } finally {
      setDeletingPhotoUrl(null);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData(prev => {
      const newData = {
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      };
      
      setHasChanges(true);
      setSuccess(false);
      return newData;
    });
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = value === '' ? '' : parseFloat(value);
    
    setFormData(prev => ({
      ...prev,
      [name]: numValue,
    }));
    setHasChanges(true);
    setSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!restaurantData?.slug) {
      setError('No se encontró información del restaurante');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess(false);

    try {
      const patch: any = {
        name: formData.name,
        description: formData.description,
        is_published: formData.is_published,
      };

      patch.whatsapp_phone = formData.whatsapp_phone || null;
      patch.email = formData.email || null;
      patch.address = formData.address || null;
      patch.city = formData.city || undefined;

      patch.availability = formData.availability ? 'AVAILABLE' : 'UNAVAILABLE';
      patch.available_count = formData.available_count || null;

      const result = await updatePlace({
        slug: restaurantData.slug,
        patch,
        replace_media: false,
        tag_ids: selectedTagIds,
      });

      if (result.ok) {
        // Actualizar tags por separado
        try {
          await replacePlaceTags(restaurantData.slug, selectedTagIds);
        } catch (tagError) {
          console.error('Error updating tags:', tagError);
          // No bloqueamos la actualización si falla la asignación de tags
        }

        setSuccess(true);
        setHasChanges(false);
        setTimeout(() => {
          loadPlace();
        }, 500);
      } else {
        setError(result.error || 'Error al guardar los cambios');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar los cambios');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="edit-restaurant">
        <div className="loading-container">
          <p>Cargando datos del restaurante...</p>
        </div>
      </div>
    );
  }

  if (!place) {
    return (
      <div className="edit-restaurant">
        <div className="error-container">
          <p>{error || 'No se encontró el restaurante'}</p>
          <button onClick={() => navigate('/resto/dashboard')}>Volver al Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div className="edit-restaurant">
      <div className="edit-header">
        <h1>Editar Datos del Restaurante</h1>
        <p className="subtitle">{place.name}</p>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          ¡Cambios guardados exitosamente!
        </div>
      )}

      <form onSubmit={handleSubmit} className="edit-form">
        <section className="form-section">
          <h2>Información Básica</h2>
          
          <div className="form-group">
            <label htmlFor="name">Nombre</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Nombre del restaurante"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Descripción</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              placeholder="Describe tu restaurante..."
            />
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="is_published"
                checked={formData.is_published}
                onChange={handleChange}
              />
              <span>Restaurante publicado</span>
            </label>
            <small>Si está publicado, aparecerá en el sitio público</small>
          </div>
        </section>

        <section className="form-section">
          <h2>Logo del Restaurante</h2>
          
          <div className="form-group">
            <label>Logo actual</label>
            {place.logo_url ? (
              <div className="logo-preview-container">
                <img src={place.logo_url} alt="Logo del restaurante" className="logo-preview" />
                <div className="logo-actions">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={handleLogoUploadClick}
                    disabled={uploadingLogo}
                  >
                    {uploadingLogo ? 'Subiendo...' : 'Cambiar logo'}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                    style={{ display: 'none' }}
                    onChange={handleLogoUpload}
                    disabled={uploadingLogo}
                  />
                  <button
                    type="button"
                    className="btn-danger"
                    onClick={handleLogoDelete}
                    disabled={deletingLogo}
                  >
                    {deletingLogo ? 'Eliminando...' : 'Eliminar logo'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="logo-upload-container">
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleLogoUploadClick}
                  disabled={uploadingLogo}
                >
                  {uploadingLogo ? 'Subiendo...' : 'Subir logo'}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                  style={{ display: 'none' }}
                  onChange={handleLogoUpload}
                  disabled={uploadingLogo}
                />
                <small>Formatos permitidos: PNG, JPEG, WEBP, SVG. Tamaño máximo: 2MB</small>
              </div>
            )}
          </div>
        </section>

        <section className="form-section">
          <h2>Fotos del Restaurante</h2>
          
          <div className="form-group">
            <label>Fotos actuales</label>
            {place.place_media && place.place_media.length > 0 ? (
              <div className="photos-grid">
                {place.place_media.map((media) => (
                  <div key={media.id || media.url} className="photo-item">
                    <img src={media.url} alt={`Foto`} className="photo-preview" />
                    <button
                      type="button"
                      className="photo-delete-btn"
                      onClick={() => handlePhotoDelete(media.url)}
                      disabled={deletingPhotoUrl === media.url}
                      title="Eliminar foto"
                    >
                      {deletingPhotoUrl === media.url ? 'Eliminando...' : '×'}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-photos">No hay fotos cargadas</p>
            )}
            
            <div className="photo-upload-container">
              <button
                type="button"
                className="btn-primary"
                onClick={handlePhotoUploadClick}
                disabled={uploadingPhoto}
              >
                {uploadingPhoto ? 'Subiendo...' : '+ Agregar foto'}
              </button>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                style={{ display: 'none' }}
                onChange={handlePhotoUpload}
                disabled={uploadingPhoto}
              />
              <small>Formatos permitidos: PNG, JPEG, WEBP. Tamaño máximo: 5MB. Máximo 5 fotos por restaurante.</small>
            </div>
          </div>
        </section>

        <section className="form-section">
          <h2>Menú</h2>
          
          <div className="form-group">
            <p>Administra el menú de tu restaurante: categorías, platos, precios y más.</p>
            <p style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '0.5rem' }}>
              La funcionalidad de administración de menú estará disponible próximamente.
            </p>
          </div>
        </section>

        <section className="form-section">
          <h2>Contacto</h2>

          <div className="form-group">
            <label htmlFor="whatsapp_phone">WhatsApp</label>
            <input
              type="text"
              id="whatsapp_phone"
              name="whatsapp_phone"
              value={formData.whatsapp_phone}
              onChange={handleChange}
              placeholder="341123456789"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="restaurante@ejemplo.com"
            />
          </div>
        </section>

        <section className="form-section">
          <h2>Ubicación</h2>

          <div className="form-group">
            <label htmlFor="city">Ciudad</label>
            <input
              type="text"
              id="city"
              name="city"
              value={formData.city}
              onChange={handleChange}
              placeholder="Rosario"
            />
          </div>

          <div className="form-group">
            <label htmlFor="address">Dirección</label>
            <input
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Calle y número"
            />
          </div>
        </section>

        <section className="form-section">
          <h2>Tags</h2>
          
          <div className="form-group">
            <label>Selecciona los tags que describen tu restaurante</label>
            
            {/* Tags seleccionados */}
            {selectedTags.length > 0 && (
              <div className="selected-tags">
                {selectedTags.map(tag => (
                  <span key={tag.id} className="selected-tag">
                    {tag.name}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag.id)}
                      className="tag-remove-btn"
                      aria-label={`Eliminar ${tag.name}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Input para crear nuevo tag */}
            {showTagInput ? (
              <div className="new-tag-input-wrapper">
                <input
                  type="text"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Escribe un nuevo tag y presiona Enter"
                  className="new-tag-input"
                  autoFocus
                  disabled={creatingTag}
                />
                <div className="new-tag-actions">
                  <button
                    type="button"
                    onClick={handleCreateTag}
                    className="btn-tag-add"
                    disabled={!newTagInput.trim() || creatingTag}
                  >
                    {creatingTag ? 'Creando...' : 'Agregar'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowTagInput(false);
                      setNewTagInput('');
                    }}
                    className="btn-tag-cancel"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowTagInput(true)}
                className="btn-add-tag"
              >
                + Agregar nuevo tag
              </button>
            )}

            {/* Lista de tags disponibles */}
            {availableTags.length > 0 && (
              <div className="tags-selector">
                <p className="tags-label">Tags disponibles (creados por nosotros y otros restaurantes):</p>
                <div className="tags-list">
                  {availableTags.map(tag => {
                    const isSelected = selectedTagIds.includes(tag.id);
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => handleTagToggle(tag.id)}
                        className={`tag-chip ${isSelected ? 'tag-chip-selected' : ''}`}
                      >
                        {isSelected && <span className="tag-checkmark">✓</span>}
                        {tag.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            
            <small>Los tags ayudan a los clientes a encontrar tu restaurante</small>
          </div>
        </section>

        <section className="form-section">
          <h2>Disponibilidad</h2>

          <div className="form-group">
            <label className="switch-container">
              <span className="switch-label">Disponible</span>
              <label className="switch">
                <input
                  type="checkbox"
                  name="availability"
                  checked={formData.availability}
                  onChange={handleChange}
                />
                <span className="slider"></span>
              </label>
            </label>
            <small>Si está disponible, los clientes podrán hacer reservas</small>
          </div>

          <div className="form-group">
            <label htmlFor="available_count">Cupos disponibles</label>
            <input
              type="number"
              id="available_count"
              name="available_count"
              value={formData.available_count}
              onChange={handleNumberChange}
              min="0"
              placeholder="0"
            />
            <small>Número de mesas o lugares disponibles</small>
          </div>
        </section>

        <div className="form-actions">
          <button
            type="button"
            onClick={() => navigate('/resto/dashboard')}
            className="btn btn-secondary"
            disabled={saving}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!hasChanges || saving}
          >
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default EditRestaurant;

