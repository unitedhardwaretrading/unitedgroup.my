document.addEventListener('DOMContentLoaded', () => {
  
  // === UI & Animations ===
  const navbar = document.getElementById('navbar');
  const menuToggle = document.getElementById('menuToggle');
  const navLinks = document.getElementById('navLinks');
  
  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) navbar.classList.add('scrolled');
    else navbar.classList.remove('scrolled');
  });

  if (menuToggle) {
    menuToggle.addEventListener('click', () => {
      navLinks.classList.toggle('show');
    });
  }

  const revealElements = document.querySelectorAll('.reveal');
  if (revealElements.length > 0) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    
    revealElements.forEach(el => revealObserver.observe(el));
  }

  // Helpers for Scene (Category, multi-select) & Brand tags
  function getCategoryName(catId) {
    const cat = CATEGORIES.find(c => c.id == catId);
    return cat ? cat.name : "Others";
  }

  function getProductSceneIds(product) {
    const raw = Array.isArray(product && product.categoryIds) && product.categoryIds.length
      ? product.categoryIds
      : (product && product.categoryId !== undefined && product.categoryId !== null ? [product.categoryId] : []);
    const valid = [...new Set(raw.map(Number).filter(id => CATEGORIES.some(c => c.id == id)))];
    if (valid.length) return valid;
    const others = CATEGORIES.find(c => c.isFallback || String(c.name).toLowerCase() === 'others');
    return others ? [Number(others.id)] : [];
  }

  function getProductSceneNames(product) {
    const ids = getProductSceneIds(product);
    return ids.length ? ids.map(getCategoryName) : ["Others"];
  }

  function getBrandName(product) {
    const b = (product && product.brand ? String(product.brand) : '').trim();
    return b || "Others";
  }

  function formatDisplayPrice(price) {
    const raw = (price || '').toString().trim();
    if (!raw) return 'Contact for price';
    if (/rm/i.test(raw) || /contact/i.test(raw)) return raw;
    return /^\d/.test(raw) ? 'RM ' + raw : raw;
  }

  // Generic Product Card Generator (click whole card to open Details modal; click tags to filter)
  function createProductCard(product) {
    const sceneIds = getProductSceneIds(product);
    const sceneTagsHtml = sceneIds.map(sid => {
      const sName = getCategoryName(sid);
      return `<span class="product-category-tag clickable-tag" onclick="navigateToFilter('scene', '${sid}', event)">${sName}</span>`;
    }).join('');
    const brandName = getBrandName(product);
    const safeBrand = brandName.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    const imgUrl = product.image || 'https://images.unsplash.com/photo-1581093458791-9d42e0f2f0d8?auto=format&fit=crop&w=400&q=80';
    const displayPrice = formatDisplayPrice(product.price);

    return `
      <article class="product-card reveal" onclick="openProductModal(${product.id})">
        <div class="product-img-wrap">
          <img class="product-img" src="${imgUrl}" alt="${product.name}" loading="lazy">
        </div>
        <div class="product-body">
          <div class="product-tags-row">
            ${sceneTagsHtml}
            <span class="product-brand-tag clickable-tag" onclick="navigateToFilter('brand', '${safeBrand}', event)">${brandName}</span>
          </div>
          <h3 class="product-name">${product.name}</h3>
          <div class="product-price">${displayPrice}</div>
          <p class="product-desc">${product.description}</p>
        </div>
      </article>
    `;
  }

  // === TITLE ARROW CLICK HELPERS ===
  window.scrollCat = function(dir) {
    const vp = document.getElementById('catSliderViewport');
    if (vp) vp.scrollBy({ left: dir * 280, behavior: 'smooth' });
  };
  window.scrollPop = function(dir) {
    const vp = document.getElementById('popSliderViewport');
    if (vp) vp.scrollBy({ left: dir * 280, behavior: 'smooth' });
  };

  // === CATEGORY SLIDER — Mouse-tracking scroll with infinite loop ===
  const catSliderInner = document.getElementById('catSliderInner');
  const catSliderViewport = document.getElementById('catSliderViewport');

  if (catSliderInner && CATEGORIES.length > 0) {
    const sortedCats = [...CATEGORIES].sort((a, b) => (a.homeOrder || 999) - (b.homeOrder || 999));
    const GAP = 20;
    const CARD_W = 280;
    const ITEM_STEP = CARD_W + GAP;
    const singleSetWidth = sortedCats.length * ITEM_STEP;

    function buildItem(cat) {
      const el = document.createElement('a');
      el.href = `product.html?category=${cat.id}`;
      el.className = 'cat-item';
      if (cat.image) {
        el.innerHTML = `<div class="cat-item-img-wrap"><img src="${cat.image}" alt="${cat.name}" loading="lazy"></div><span class="cat-label">${cat.name}</span>`;
      } else {
        el.innerHTML = `<span class="cat-icon">${cat.icon || '🔧'}</span><span class="cat-label">${cat.name}</span>`;
      }
      return el;
    }

    // Duplicate 3 times for seamless infinite loop
    for (let i = 0; i < 3; i++) {
      sortedCats.forEach(cat => catSliderInner.appendChild(buildItem(cat)));
    }

    // Start at middle set
    catSliderViewport.scrollLeft = singleSetWidth;

    // Left/Right arrow indicators
    const arrowL = document.createElement('div');
    arrowL.className = 'cat-scroll-arrow cat-scroll-arrow-left';
    arrowL.innerHTML = '‹';
    const arrowR = document.createElement('div');
    arrowR.className = 'cat-scroll-arrow cat-scroll-arrow-right';
    arrowR.innerHTML = '›';
    catSliderViewport.appendChild(arrowL);
    catSliderViewport.appendChild(arrowR);

    let scrollSpeed = 0;
    let catRafId;

    function catTick() {
      if (Math.abs(scrollSpeed) > 0.2) {
        catSliderViewport.scrollLeft += scrollSpeed;
      }

      // Seamless infinite loop wrapping
      if (singleSetWidth > 0) {
        if (catSliderViewport.scrollLeft >= singleSetWidth * 2) {
          catSliderViewport.scrollLeft -= singleSetWidth;
        } else if (catSliderViewport.scrollLeft <= 5) {
          catSliderViewport.scrollLeft += singleSetWidth;
        }
      }

      catRafId = requestAnimationFrame(catTick);
    }
    catRafId = requestAnimationFrame(catTick);

    // Mouse move tracking: position relative to viewport edges controls scroll speed
    catSliderViewport.addEventListener('mousemove', e => {
      const rect = catSliderViewport.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const viewW = rect.width;
      const edgeZone = viewW * 0.25; // 25% edge zone on each side

      if (mouseX < edgeZone) {
        // Left zone: scroll left (negative), faster closer to edge
        scrollSpeed = -((edgeZone - mouseX) / edgeZone) * 6;
        arrowL.style.opacity = '1';
        arrowR.style.opacity = '0.3';
      } else if (mouseX > viewW - edgeZone) {
        // Right zone: scroll right (positive), faster closer to edge
        scrollSpeed = ((mouseX - (viewW - edgeZone)) / edgeZone) * 6;
        arrowL.style.opacity = '0.3';
        arrowR.style.opacity = '1';
      } else {
        scrollSpeed = 0;
        arrowL.style.opacity = '0.3';
        arrowR.style.opacity = '0.3';
      }
    });

    catSliderViewport.addEventListener('mouseleave', () => {
      scrollSpeed = 0;
      arrowL.style.opacity = '0';
      arrowR.style.opacity = '0';
    });

    catSliderViewport.addEventListener('mouseenter', () => {
      arrowL.style.opacity = '0.3';
      arrowR.style.opacity = '0.3';
    });

    // Touch swipe support for mobile
    let touchStartX = 0;
    let touchScrollStart = 0;
    catSliderViewport.addEventListener('touchstart', e => {
      touchStartX = e.touches[0].clientX;
      touchScrollStart = catSliderViewport.scrollLeft;
    }, { passive: true });
    catSliderViewport.addEventListener('touchmove', e => {
      const dx = touchStartX - e.touches[0].clientX;
      catSliderViewport.scrollLeft = touchScrollStart + dx;
    }, { passive: true });
  }

  // === HERO BACKGROUND ROTATION ===
  const heroSection = document.querySelector('.hero');
  if (heroSection) {
    const heroImages = CATEGORIES.filter(c => c.image).map(c => c.image);
    // Add default image to the list
    heroImages.unshift('https://images.unsplash.com/photo-1581093458791-9d42e0f2f0d8?auto=format&fit=crop&w=1400&q=80');
    
    if (heroImages.length > 1) {
      let heroImgIdx = 0;
      setInterval(() => {
        heroImgIdx = (heroImgIdx + 1) % heroImages.length;
        heroSection.style.background = `linear-gradient(135deg, rgba(8,42,100,.82), rgba(13,71,161,.75)), url('${heroImages[heroImgIdx]}') center/cover no-repeat`;
      }, 5500);
    }
  }

  // === HOME PAGE — Popular Products Slider — Mouse-tracking scroll with infinite loop ===
  const popSliderInner = document.getElementById('popSliderInner');
  const popSliderViewport = document.getElementById('popSliderViewport');

  if (popSliderInner && PRODUCTS.length > 0) {
    const popProds = PRODUCTS.filter(p => p.isPopular).sort((a, b) => (a.popularOrder || 999) - (b.popularOrder || 999));
    
    if (popProds.length > 0) {
      const GAP = 20;
      const CARD_W = 260;
      const ITEM_STEP = CARD_W + GAP;
      const singleSetWidth = popProds.length * ITEM_STEP;

      function buildPopItem(p) {
        const imgUrl = p.image || 'https://images.unsplash.com/photo-1581093458791-9d42e0f2f0d8?auto=format&fit=crop&w=300&q=80';
        const sceneTagsHtml = getProductSceneIds(p).map(sid => {
          const sName = getCategoryName(sid);
          return `<span class="product-category-tag clickable-tag" onclick="navigateToFilter('scene', '${sid}', event)">${sName}</span>`;
        }).join('');
        const brandName = getBrandName(p);
        const safeBrand = brandName.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
        const displayPrice = formatDisplayPrice(p.price);
        
        const el = document.createElement('a');
        el.href = `product.html?q=${encodeURIComponent(p.name)}`;
        el.className = 'product-card pop-slider-card';
        el.innerHTML = `
          <div class="product-img-wrap">
            <img class="product-img" src="${imgUrl}" alt="${p.name}" loading="lazy">
          </div>
          <div class="product-body">
            <div class="product-tags-row">
              ${sceneTagsHtml}
              <span class="product-brand-tag clickable-tag" onclick="navigateToFilter('brand', '${safeBrand}', event)">${brandName}</span>
            </div>
            <h3 class="product-name">${p.name}</h3>
            <div class="product-price">${displayPrice}</div>
          </div>
        `;
        return el;
      }

      // Duplicate 3 times for seamless infinite loop
      for (let i = 0; i < 3; i++) {
        popProds.forEach(p => popSliderInner.appendChild(buildPopItem(p)));
      }

      // Start at middle set
      popSliderViewport.scrollLeft = singleSetWidth;

      // Left/Right arrow indicators
      const arrowLPop = document.createElement('div');
      arrowLPop.className = 'cat-scroll-arrow cat-scroll-arrow-left';
      arrowLPop.innerHTML = '‹';
      const arrowRPop = document.createElement('div');
      arrowRPop.className = 'cat-scroll-arrow cat-scroll-arrow-right';
      arrowRPop.innerHTML = '›';
      popSliderViewport.appendChild(arrowLPop);
      popSliderViewport.appendChild(arrowRPop);

      let scrollSpeedPop = 0;
      let popRafId;

      function popTick() {
        if (Math.abs(scrollSpeedPop) > 0.2) {
          popSliderViewport.scrollLeft += scrollSpeedPop;
        }

        // Seamless infinite loop wrapping
        if (singleSetWidth > 0) {
          if (popSliderViewport.scrollLeft >= singleSetWidth * 2) {
            popSliderViewport.scrollLeft -= singleSetWidth;
          } else if (popSliderViewport.scrollLeft <= 5) {
            popSliderViewport.scrollLeft += singleSetWidth;
          }
        }

        popRafId = requestAnimationFrame(popTick);
      }
      popRafId = requestAnimationFrame(popTick);

      // Mouse move tracking: position relative to viewport edges controls scroll speed
      popSliderViewport.addEventListener('mousemove', e => {
        const rect = popSliderViewport.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const viewW = rect.width;
        const edgeZone = viewW * 0.25;

        if (mouseX < edgeZone) {
          // Left zone: scroll left (negative), faster closer to edge
          scrollSpeedPop = -((edgeZone - mouseX) / edgeZone) * 6;
          arrowLPop.style.opacity = '1';
          arrowRPop.style.opacity = '0.3';
        } else if (mouseX > viewW - edgeZone) {
          // Right zone: scroll right (positive), faster closer to edge
          scrollSpeedPop = ((mouseX - (viewW - edgeZone)) / edgeZone) * 6;
          arrowLPop.style.opacity = '0.3';
          arrowRPop.style.opacity = '1';
        } else {
          scrollSpeedPop = 0;
          arrowLPop.style.opacity = '0.3';
          arrowRPop.style.opacity = '0.3';
        }
      });

      popSliderViewport.addEventListener('mouseleave', () => {
        scrollSpeedPop = 0;
        arrowLPop.style.opacity = '0';
        arrowRPop.style.opacity = '0';
      });

      popSliderViewport.addEventListener('mouseenter', () => {
        arrowLPop.style.opacity = '0.3';
        arrowRPop.style.opacity = '0.3';
      });

      // Touch swipe support for mobile
      let touchStartXPop = 0;
      let touchScrollStartPop = 0;
      popSliderViewport.addEventListener('touchstart', e => {
        touchStartXPop = e.touches[0].clientX;
        touchScrollStartPop = popSliderViewport.scrollLeft;
      }, { passive: true });
      popSliderViewport.addEventListener('touchmove', e => {
        const dx = touchStartXPop - e.touches[0].clientX;
        popSliderViewport.scrollLeft = touchScrollStartPop + dx;
      }, { passive: true });

    } else {
      popSliderInner.innerHTML = '<p style="padding: 20px;">No popular products selected yet.</p>';
    }
  }

  // === PRODUCT PAGE LOGIC (2 Branches: Scenes & Brands) ===
  const productPageGrid = document.getElementById('productPageGrid');
  const pageSearch = document.getElementById('pageSearch');
  const sidebarCatList = document.getElementById('sidebarCatList');
  const sidebarBranchTabs = document.getElementById('sidebarBranchTabs');
  const sidebarTitle = document.getElementById('sidebarTitle');
  const pageCategoryTitle = document.getElementById('pageCategoryTitle');
  const breadcrumbCurrent = document.getElementById('breadcrumbCurrent');
  const productTotalCount = document.getElementById('productTotalCount');
  const productSidebar = document.getElementById('productSidebar');
  const mobileFilterBtn = document.getElementById('mobileFilterBtn');
  const mobileFilterLabel = document.getElementById('mobileFilterLabel');
  const mobileFilterBackdrop = document.getElementById('mobileFilterBackdrop');
  const sidebarDrawerClose = document.getElementById('sidebarDrawerClose');

  if (productPageGrid) {
    function openFilterDrawer() {
      if (!productSidebar) return;
      productSidebar.classList.add('open');
      if (mobileFilterBackdrop) mobileFilterBackdrop.classList.add('show');
      if (mobileFilterBtn) mobileFilterBtn.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    }
    function closeFilterDrawer() {
      if (!productSidebar) return;
      productSidebar.classList.remove('open');
      if (mobileFilterBackdrop) mobileFilterBackdrop.classList.remove('show');
      if (mobileFilterBtn) mobileFilterBtn.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }
    if (mobileFilterBtn) mobileFilterBtn.addEventListener('click', openFilterDrawer);
    if (mobileFilterBackdrop) mobileFilterBackdrop.addEventListener('click', closeFilterDrawer);
    if (sidebarDrawerClose) sidebarDrawerClose.addEventListener('click', closeFilterDrawer);
    let activeBranch = 'scene'; // 'scene' | 'brand'
    let currentCat = 'all';
    let currentBrand = 'all';
    let currentQuery = '';

    // Parse URL params
    const urlParams = new URLSearchParams(window.location.search);
    const urlQuery = urlParams.get('q');
    const urlCat = urlParams.get('category');
    const urlBrand = urlParams.get('brand');

    if (urlQuery) {
      currentQuery = urlQuery;
      if (pageSearch) pageSearch.value = urlQuery;
    }
    if (urlBrand) {
      activeBranch = 'brand';
      currentBrand = urlBrand;
    } else if (urlCat) {
      activeBranch = 'scene';
      currentCat = urlCat;
    }

    // Allow clicking Scene / Brand tags anywhere on product.html to jump directly to that filter
    window.applyProductFilter = function(type, value) {
      currentQuery = '';
      if (pageSearch) pageSearch.value = '';
      if (type === 'brand') {
        activeBranch = 'brand';
        currentBrand = value;
      } else {
        activeBranch = 'scene';
        currentCat = String(value);
      }
      updateBranchTabsUI();
      renderSidebar();
      renderProducts();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Collect all brand names (from BRANDS + PRODUCTS), with Others at the end
    function getAllBrandsList() {
      const set = new Set();
      if (typeof BRANDS !== 'undefined' && Array.isArray(BRANDS)) {
        BRANDS.forEach(b => {
          const n = (b && b.name ? String(b.name) : '').trim();
          if (n && n.toLowerCase() !== 'others') set.add(n);
        });
      }
      PRODUCTS.forEach(p => {
        const b = getBrandName(p);
        if (b && b.toLowerCase() !== 'others') set.add(b);
      });
      const list = [...set].sort((a, b) => a.localeCompare(b));
      list.push('Others');
      return list;
    }

    function updateBranchTabsUI() {
      if (sidebarBranchTabs) {
        sidebarBranchTabs.querySelectorAll('.sidebar-branch-btn').forEach(btn => {
          btn.classList.toggle('active', btn.dataset.branch === activeBranch);
        });
      }
      if (sidebarTitle) {
        sidebarTitle.textContent = activeBranch === 'scene' ? 'Scenes' : 'Brands';
      }
    }

    if (sidebarBranchTabs) {
      sidebarBranchTabs.querySelectorAll('.sidebar-branch-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const nextBranch = btn.dataset.branch;
          if (nextBranch === activeBranch) return;
          activeBranch = nextBranch;
          updateBranchTabsUI();
          renderSidebar();
          renderProducts();
        });
      });
    }

    // Render Sidebar (Scenes or Brands)
    function renderSidebar() {
      if (!sidebarCatList) return;

      const totalCount = PRODUCTS.length;
      let html = '';

      if (activeBranch === 'scene') {
        const sortedCats = [...CATEGORIES].sort((a, b) => (a.homeOrder || 999) - (b.homeOrder || 999));
        html = `
          <li class="sidebar-cat-item ${currentCat === 'all' ? 'active' : ''}" data-id="all">
            <div class="sidebar-cat-left">
              <span class="sidebar-cat-arrow">›</span>
              <span>ALL SCENES</span>
            </div>
            <span class="sidebar-cat-count">${totalCount}</span>
          </li>
        `;

        sortedCats.forEach(cat => {
          const count = PRODUCTS.filter(p => getProductSceneIds(p).includes(Number(cat.id))).length;
          const isActive = String(currentCat) === String(cat.id);
          html += `
            <li class="sidebar-cat-item ${isActive ? 'active' : ''}" data-id="${cat.id}">
              <div class="sidebar-cat-left">
                <span class="sidebar-cat-arrow">›</span>
                <span>${cat.name.toUpperCase()}</span>
              </div>
              <span class="sidebar-cat-count">${count}</span>
            </li>
          `;
        });
      } else {
        const brandList = getAllBrandsList();
        html = `
          <li class="sidebar-cat-item ${currentBrand === 'all' ? 'active' : ''}" data-id="all">
            <div class="sidebar-cat-left">
              <span class="sidebar-cat-arrow">›</span>
              <span>ALL BRANDS</span>
            </div>
            <span class="sidebar-cat-count">${totalCount}</span>
          </li>
        `;

        brandList.forEach(brandName => {
          const count = PRODUCTS.filter(p => getBrandName(p).toLowerCase() === brandName.toLowerCase()).length;
          const isActive = currentBrand !== 'all' && currentBrand.toLowerCase() === brandName.toLowerCase();
          html += `
            <li class="sidebar-cat-item ${isActive ? 'active' : ''}" data-id="${brandName}">
              <div class="sidebar-cat-left">
                <span class="sidebar-cat-arrow">›</span>
                <span>${brandName.toUpperCase()}</span>
              </div>
              <span class="sidebar-cat-count">${count}</span>
            </li>
          `;
        });
      }

      sidebarCatList.innerHTML = html;

      // Scroll active tab into view if needed
      const activeEl = sidebarCatList.querySelector('.sidebar-cat-item.active');
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }

      // Add click handlers
      sidebarCatList.querySelectorAll('.sidebar-cat-item').forEach(item => {
        item.addEventListener('click', () => {
          if (activeBranch === 'scene') {
            currentCat = item.dataset.id;
          } else {
            currentBrand = item.dataset.id;
          }
          renderSidebar();
          renderProducts();
          // On mobile, close the filter drawer and scroll up to top of products
          if (window.innerWidth <= 991) {
            closeFilterDrawer();
            const contentEl = document.querySelector('.product-content');
            if (contentEl && window.scrollY > contentEl.offsetTop - 80) {
              window.scrollTo({ top: contentEl.offsetTop - 80, behavior: 'smooth' });
            }
          }
        });
      });
    }

    function renderProducts() {
      const q = (pageSearch ? pageSearch.value : currentQuery).toLowerCase().trim();

      const filtered = PRODUCTS.filter(p => {
        const detailsText = (p.details || p.material || '').toLowerCase();
        const brandText = getBrandName(p).toLowerCase();
        const matchQ = !q
          || p.name.toLowerCase().includes(q)
          || (p.description && p.description.toLowerCase().includes(q))
          || (p.application && p.application.toLowerCase().includes(q))
          || detailsText.includes(q)
          || brandText.includes(q);

        const matchBranch = activeBranch === 'scene'
          ? (currentCat === 'all' || getProductSceneIds(p).includes(Number(currentCat)))
          : (currentBrand === 'all' || brandText === currentBrand.toLowerCase());

        return matchQ && matchBranch;
      });

      // Update titles and counts
      if (activeBranch === 'scene') {
        if (currentCat === 'all') {
          if (pageCategoryTitle) pageCategoryTitle.textContent = 'Our Products';
          if (breadcrumbCurrent) breadcrumbCurrent.textContent = 'All Scenes';
        } else {
          const activeCatObj = CATEGORIES.find(c => String(c.id) === String(currentCat));
          const catTitle = activeCatObj ? activeCatObj.name : 'Others';
          if (pageCategoryTitle) pageCategoryTitle.textContent = catTitle;
          if (breadcrumbCurrent) breadcrumbCurrent.textContent = `Scene: ${catTitle}`;
        }
      } else {
        if (currentBrand === 'all') {
          if (pageCategoryTitle) pageCategoryTitle.textContent = 'All Brands';
          if (breadcrumbCurrent) breadcrumbCurrent.textContent = 'All Brands';
        } else {
          if (pageCategoryTitle) pageCategoryTitle.textContent = currentBrand;
          if (breadcrumbCurrent) breadcrumbCurrent.textContent = `Brand: ${currentBrand}`;
        }
      }

      if (mobileFilterLabel) {
        if (activeBranch === 'scene' && currentCat !== 'all') {
          const activeCatObj = CATEGORIES.find(c => String(c.id) === String(currentCat));
          mobileFilterLabel.textContent = `Filters · ${activeCatObj ? activeCatObj.name : 'Others'}`;
        } else if (activeBranch === 'brand' && currentBrand !== 'all') {
          mobileFilterLabel.textContent = `Filters · ${currentBrand}`;
        } else {
          mobileFilterLabel.textContent = 'Filters';
        }
      }

      if (productTotalCount) {
        productTotalCount.textContent = `Showing ${filtered.length} product${filtered.length === 1 ? '' : 's'}`;
      }

      if (filtered.length === 0) {
        productPageGrid.innerHTML = `<div class="empty-state" style="grid-column: 1 / -1;"><h3>No products found.</h3><p>Try a different search keyword, scene, or brand.</p></div>`;
      } else {
        productPageGrid.innerHTML = filtered.map(p => createProductCard(p)).join('');
      }

      document.querySelectorAll('.reveal:not(.visible)').forEach(el => {
        setTimeout(() => el.classList.add('visible'), 50);
      });
    }

    if (pageSearch) pageSearch.addEventListener('input', renderProducts);

    updateBranchTabsUI();
    renderSidebar();
    renderProducts();
  }

});

// === TAG NAVIGATION HELPER (Global Scope) ===
function navigateToFilter(type, value, evt) {
  if (evt) {
    evt.preventDefault();
    evt.stopPropagation();
  }
  closeProductModal();
  if (typeof window.applyProductFilter === 'function') {
    window.applyProductFilter(type, value);
  } else {
    const param = type === 'brand' ? `brand=${encodeURIComponent(value)}` : `category=${encodeURIComponent(value)}`;
    window.location.href = `product.html?${param}`;
  }
}

// === MODAL LOGIC (Global Scope) ===
function openProductModal(id) {
  const product = PRODUCTS.find(p => p.id == id);
  if (!product) return;

  const modal = document.getElementById('productModal');
  if (!modal) return;

  const rawSceneIds = Array.isArray(product.categoryIds) && product.categoryIds.length
    ? product.categoryIds
    : (product.categoryId !== undefined && product.categoryId !== null ? [product.categoryId] : []);
  const validSceneIds = [...new Set(rawSceneIds.map(Number))].filter(sid => CATEGORIES.some(c => c.id == sid));
  const othersCat = CATEGORIES.find(c => c.isFallback || String(c.name).toLowerCase() === 'others');
  const finalSceneIds = validSceneIds.length ? validSceneIds : (othersCat ? [othersCat.id] : []);
  const brandName = (product.brand && String(product.brand).trim()) || "Others";
  const safeBrand = brandName.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  const detailsText = product.details || (product.material ? `Material: ${product.material}` : '') || 'N/A';
  const imgUrl = product.image || 'https://images.unsplash.com/photo-1581093458791-9d42e0f2f0d8?auto=format&fit=crop&w=600&q=80';

  document.getElementById('modalImg').src = imgUrl;
  const tagsRow = modal.querySelector('.modal-tags-row');
  if (tagsRow) {
    const sceneHtml = finalSceneIds.map(sid => {
      const sName = CATEGORIES.find(c => c.id == sid)?.name || "Others";
      return `<span class="modal-cat-tag clickable-tag" onclick="navigateToFilter('scene', '${sid}', event)">${sName}</span>`;
    }).join('');
    tagsRow.innerHTML = sceneHtml + `<span class="modal-brand-tag clickable-tag" onclick="navigateToFilter('brand', '${safeBrand}', event)">${brandName}</span>`;
  } else {
    const sceneNames = finalSceneIds.map(sid => CATEGORIES.find(c => c.id == sid)?.name || "Others");
    document.getElementById('modalCatTag').textContent = sceneNames.join(', ');
    const modalBrandEl = document.getElementById('modalBrandTag');
    if (modalBrandEl) modalBrandEl.textContent = brandName;
  }
  document.getElementById('modalName').textContent = product.name;
  document.getElementById('modalDesc').textContent = product.description;
  document.getElementById('modalApp').textContent = product.application || 'N/A';
  const modalDetailsEl = document.getElementById('modalDetails') || document.getElementById('modalMat');
  if (modalDetailsEl) modalDetailsEl.textContent = detailsText;

  const waText = encodeURIComponent(`Hello, I would like to request a quotation for ${product.name}.`);
  document.getElementById('modalWaBtn').href = `https://wa.me/60189029391?text=${waText}`;

  const emailSubject = encodeURIComponent(`Hardware Product Enquiry - ${product.name}`);
  document.getElementById('modalEmBtn').href = `mailto:united.hardware.trading@gmail.com?subject=${emailSubject}`;

  modal.classList.add('show');
  document.body.style.overflow = 'hidden';
}

function closeProductModal() {
  const modal = document.getElementById('productModal');
  if (modal) {
    modal.classList.remove('show');
    document.body.style.overflow = '';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const modalClose = document.getElementById('modalClose');
  if (modalClose) modalClose.addEventListener('click', closeProductModal);
  
  const modal = document.getElementById('productModal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeProductModal();
    });
  }
});
