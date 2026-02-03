import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRestaurantData } from '../utils/auth';
import {
  getMenu,
  createMenuCategory,
  updateMenuCategory,
  deleteMenuCategory,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
} from '../services/api';
import './EditMenu.css';

interface MenuCategory {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
  is_active: boolean;
  items?: MenuItem[];
}

interface MenuItem {
  id: string;
  title: string;
  description?: string;
  price_amount: number;
  currency: string;
  category_id: string;
  is_available: boolean;
  is_featured: boolean;
  sort_order: number;
}

function EditMenu() {
  const navigate = useNavigate();
  const restaurantData = getRestaurantData();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [menuData, setMenuData] = useState<any>(null);

  // Estados para categorías
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(null);
  const [categoryForm, setCategoryForm] = useState({ name: '', sort_order: 0 });

  // Estados para items
  const [showItemForm, setShowItemForm] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [itemForm, setItemForm] = useState({
    title: '',
    description: '',
    price_amount: '',
    category_id: '',
  });

  useEffect(() => {
    if (!restaurantData?.slug) {
      setError('No se encontró información del restaurante');
      setLoading(false);
      return;
    }

    loadMenu();
  }, []);

  const loadMenu = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getMenu(restaurantData!.slug!);
      
      if (response.ok && response.data) {
        setMenuData(response.data);
      } else {
        setError(response.error || 'Error al cargar el menú');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar el menú');
    } finally {
      setLoading(false);
    }
  };

  // ========== CATEGORÍAS ==========

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (editingCategory) {
        await updateMenuCategory(editingCategory.id, {
          name: categoryForm.name,
          sort_order: categoryForm.sort_order,
        });
        setSuccess('✅ Categoría actualizada correctamente');
      } else {
        await createMenuCategory(restaurantData!.slug!, categoryForm.name, categoryForm.sort_order);
        setSuccess('✅ Categoría creada correctamente');
      }
      
      setShowCategoryForm(false);
      setEditingCategory(null);
      setCategoryForm({ name: '', sort_order: 0 });
      loadMenu();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar la categoría');
    }
  };

  const handleEditCategory = (category: MenuCategory) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      sort_order: category.sort_order,
    });
    setShowCategoryForm(true);
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta categoría? Se eliminarán todos los platos asociados.')) {
      return;
    }

    try {
      setError('');
      await deleteMenuCategory(id);
      setSuccess('✅ Categoría eliminada correctamente');
      loadMenu();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar la categoría');
    }
  };

  // ========== ITEMS ==========

  const handleItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const priceAmount = parseFloat(itemForm.price_amount);
      if (isNaN(priceAmount) || priceAmount < 0) {
        setError('El precio debe ser un número válido');
        return;
      }

      if (editingItem) {
        await updateMenuItem(editingItem.id, {
          title: itemForm.title,
          description: itemForm.description || undefined,
          price_amount: priceAmount,
          category_id: itemForm.category_id,
        });
        setSuccess('✅ Plato actualizado correctamente');
      } else {
        await createMenuItem({
          slug: restaurantData!.slug!,
          category_id: itemForm.category_id,
          title: itemForm.title,
          description: itemForm.description || undefined,
          price_amount: priceAmount,
          currency: 'ARS',
        });
        setSuccess('✅ Plato agregado al menú');
      }
      
      setShowItemForm(false);
      setEditingItem(null);
      setItemForm({ title: '', description: '', price_amount: '', category_id: '' });
      loadMenu();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar el plato');
    }
  };

  const handleEditItem = (item: MenuItem) => {
    setEditingItem(item);
    setItemForm({
      title: item.title,
      description: item.description || '',
      price_amount: item.price_amount.toString(),
      category_id: item.category_id,
    });
    setShowItemForm(true);
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este plato?')) {
      return;
    }

    try {
      setError('');
      await deleteMenuItem(id);
      setSuccess('✅ Plato eliminado correctamente');
      loadMenu();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar el plato');
    }
  };

  const handleNewItem = (categoryId: string) => {
    setEditingItem(null);
    setItemForm({ title: '', description: '', price_amount: '', category_id: categoryId });
    setShowItemForm(true);
  };

  if (loading) {
    return (
      <div className="edit-menu">
        <div className="loading-container">
          <p>Cargando menú...</p>
        </div>
      </div>
    );
  }

  if (error && !menuData) {
    return (
      <div className="edit-menu">
        <div className="error-container">
          <p>{error}</p>
          <button onClick={loadMenu}>Reintentar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="edit-menu">
      <div className="edit-menu-header">
        <h1>Editar Menú</h1>
        <div className="header-actions">
          <button
            className="btn-primary"
            onClick={() => {
              setEditingCategory(null);
              setCategoryForm({ name: '', sort_order: 0 });
              setShowCategoryForm(true);
            }}
          >
            + Nueva categoría
          </button>
          <button 
            className="btn-secondary"
            onClick={() => navigate('/resto/dashboard')}
          >
            Volver al dashboard
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          {success}
        </div>
      )}

      {/* Formulario de categoría */}
      {showCategoryForm && (
        <div className="form-modal">
          <div className="form-modal-content">
            <h2>{editingCategory ? 'Editar categoría' : 'Nueva categoría'}</h2>
            <form onSubmit={handleCategorySubmit}>
              <div className="form-group">
                <label htmlFor="category-name">Nombre *</label>
                <input
                  type="text"
                  id="category-name"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  required
                  placeholder="Ej: Pizzas, Pastas, Bebidas"
                />
              </div>
              <div className="form-group">
                <label htmlFor="category-sort">Orden</label>
                <input
                  type="number"
                  id="category-sort"
                  value={categoryForm.sort_order}
                  onChange={(e) => setCategoryForm({ ...categoryForm, sort_order: parseInt(e.target.value) || 0 })}
                  min="0"
                />
                <small>Número para ordenar las categorías (menor = primero)</small>
              </div>
              <div className="form-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setShowCategoryForm(false);
                    setEditingCategory(null);
                    setCategoryForm({ name: '', sort_order: 0 });
                  }}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  {editingCategory ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Formulario de item */}
      {showItemForm && (
        <div className="form-modal">
          <div className="form-modal-content">
            <h2>{editingItem ? 'Editar plato' : 'Nuevo plato'}</h2>
            <form onSubmit={handleItemSubmit}>
              <div className="form-group">
                <label htmlFor="item-category">Categoría *</label>
                <select
                  id="item-category"
                  value={itemForm.category_id}
                  onChange={(e) => {
                    setItemForm({ ...itemForm, category_id: e.target.value });
                  }}
                  required
                >
                  <option value="">Seleccionar categoría</option>
                  {menuData?.categories?.map((cat: MenuCategory) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="item-title">Nombre del plato *</label>
                <input
                  type="text"
                  id="item-title"
                  value={itemForm.title}
                  onChange={(e) => setItemForm({ ...itemForm, title: e.target.value })}
                  required
                  placeholder="Ej: Pizza Napolitana"
                />
              </div>
              <div className="form-group">
                <label htmlFor="item-description">Descripción</label>
                <textarea
                  id="item-description"
                  value={itemForm.description}
                  onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                  rows={3}
                  placeholder="Descripción del plato..."
                />
              </div>
              <div className="form-group">
                <label htmlFor="item-price">Precio (ARS) *</label>
                <input
                  type="number"
                  id="item-price"
                  value={itemForm.price_amount}
                  onChange={(e) => setItemForm({ ...itemForm, price_amount: e.target.value })}
                  required
                  min="0"
                  step="0.01"
                  placeholder="Ej: 8500"
                />
              </div>
              <div className="form-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setShowItemForm(false);
                    setEditingItem(null);
                    setItemForm({ title: '', description: '', price_amount: '', category_id: '' });
                  }}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  {editingItem ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {menuData && menuData.categories && menuData.categories.length > 0 ? (
        <div className="menu-content">
          <div className="menu-summary">
            <p>
              <strong>{menuData.categories.length}</strong> categoría{menuData.categories.length !== 1 ? 's' : ''} 
              {' • '}
              <strong>
                {menuData.categories.reduce((total: number, cat: MenuCategory) => 
                  total + (cat.items?.length || 0), 0
                )}
              </strong> plato{menuData.categories.reduce((total: number, cat: MenuCategory) => 
                total + (cat.items?.length || 0), 0
              ) !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="menu-categories">
            {menuData.categories.map((category: MenuCategory) => (
              <div key={category.id} className="menu-category-card">
                <div className="category-header">
                  <h2>{category.name}</h2>
                  <div className="category-actions">
                    <button
                      className="btn-icon"
                      onClick={() => handleNewItem(category.id)}
                      title="Agregar plato"
                    >
                      + Plato
                    </button>
                    <button
                      className="btn-icon"
                      onClick={() => handleEditCategory(category)}
                      title="Editar categoría"
                    >
                      ✏️
                    </button>
                    <button
                      className="btn-icon btn-danger"
                      onClick={() => handleDeleteCategory(category.id)}
                      title="Eliminar categoría"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                {category.items && category.items.length > 0 ? (
                  <ul className="menu-items-list">
                    {category.items.map((item: MenuItem) => (
                      <li key={item.id} className="menu-item-row">
                        <div className="menu-item-info">
                          <span className="menu-item-name">{item.title}</span>
                          {item.description && (
                            <span className="menu-item-description">{item.description}</span>
                          )}
                        </div>
                        <div className="menu-item-actions">
                          <span className="menu-item-price">
                            ${item.price_amount.toLocaleString('es-AR', { 
                              minimumFractionDigits: 0, 
                              maximumFractionDigits: 0 
                            })}
                          </span>
                          <button
                            className="btn-icon-small"
                            onClick={() => handleEditItem(item)}
                            title="Editar plato"
                          >
                            ✏️
                          </button>
                          <button
                            className="btn-icon-small btn-danger"
                            onClick={() => handleDeleteItem(item.id)}
                            title="Eliminar plato"
                          >
                            🗑️
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="no-items-container">
                    <p className="no-items">No hay platos en esta categoría</p>
                    <button
                      className="btn-link"
                      onClick={() => handleNewItem(category.id)}
                    >
                      + Agregar primer plato
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="empty-menu">
          <p>No hay menú configurado aún.</p>
          <button
            className="btn-primary"
            onClick={() => {
              setEditingCategory(null);
              setCategoryForm({ name: '', sort_order: 0 });
              setShowCategoryForm(true);
            }}
          >
            Crear primera categoría
          </button>
        </div>
      )}
    </div>
  );
}

export default EditMenu;
