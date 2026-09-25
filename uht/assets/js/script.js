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

  // Helper to get Category Name by ID
  function getCategoryName(catId) {
    const cat = CATEGORIES.find(c => c.id == catId);
    return cat ? cat.name : "Uncategorized";
  }

  // Generic Product Card Generator
  function createProductCard(product) {
    const catName = getCategoryName(product.categoryId);
    const imgUrl = product.image || 'https://images.unsplash.com/photo-1581093458791-9d42e0f2f0d8?auto=format&fit=crop&w=400&q=80';
    
    const waText = encodeURIComponent(`Hello, I would like to ask about ${product.name}.`);
    const waLink = `https://wa.me/60189029391?text=${waText}`;
    const displayPrice = product.price ? (product.price.toString().toUpperCase().includes('RM') ? product.price : 'RM ' + product.price) : 'Contact for Price';

    return `
      <article class="product-card reveal">
        <div class="product-img-wrap">
          <img class="product-img" src="${imgUrl}" alt="${product.name}" loading="lazy">
        </div>
        <div class="product-body">
          <span class="product-category-tag">${catName}</span>
          <h3 class="product-name">${product.name}</h3>
          <div class="product-price">${displayPrice}</div>
          <p class="product-desc">${product.description}</p>
          <div class="product-actions">
            <button class="btn btn-outline btn-sm" onclick="openProductModal(${product.id})">View Details</button>
            <a class="btn btn-success btn-sm" href="${waLink}" target="_blank" rel="noopener">WhatsApp</a>
          </div>
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
        el.innerHTML = `<span class="cat-icon">🔧</span><span class="cat-label">${cat.name}</span>`;
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
        const catName = CATEGORIES.find(c => c.id == p.categoryId)?.name || 'Uncategorized';
        const displayPrice = p.price ? (p.price.toString().toUpperCase().includes('RM') ? p.price : 'RM ' + p.price) : 'Contact for Price';
        
        const el = document.createElement('a');
        el.href = `product.html?q=${encodeURIComponent(p.name)}`;
        el.className = 'product-card pop-slider-card';
        el.innerHTML = `
          <div class="product-img-wrap">
            <img class="product-img" src="${imgUrl}" alt="${p.name}" loading="lazy">
          </div>
          <div class="product-body">
            <span class="product-category-tag">${catName}</span>
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

  // === PRODUCT PAGE LOGIC ===
  const productPageGrid = document.getElementById('productPageGrid');
  const pageSearch = document.getElementById('pageSearch');
  const sidebarCatList = document.getElementById('sidebarCatList');
  const pageCategoryTitle = document.getElementById('pageCategoryTitle');
  const breadcrumbCurrent = document.getElementById('breadcrumbCurrent');
  const productTotalCount = document.getElementById('productTotalCount');

  if (productPageGrid) {
    let currentCat = 'all';

    // Parse URL params
    const urlParams = new URLSearchParams(window.location.search);
    const urlQuery = urlParams.get('q');
    const urlCat = urlParams.get('category');

    if (urlQuery && pageSearch) pageSearch.value = urlQuery;
    if (urlCat) currentCat = urlCat;

    // Render Sidebar Categories
    function renderSidebar() {
      if (!sidebarCatList) return;

      const totalCount = PRODUCTS.length;
      const sortedCats = [...CATEGORIES].sort((a, b) => (a.homeOrder || 999) - (b.homeOrder || 999));

      let html = `
        <li class="sidebar-cat-item ${currentCat === 'all' ? 'active' : ''}" data-id="all">
          <div class="sidebar-cat-left">
            <span class="sidebar-cat-arrow">›</span>
            <span>ALL PRODUCTS</span>
          </div>
          <span class="sidebar-cat-count">${totalCount}</span>
        </li>
      `;

      sortedCats.forEach(cat => {
        const count = PRODUCTS.filter(p => p.categoryId == cat.id).length;
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

      sidebarCatList.innerHTML = html;

      // Add click handlers
      sidebarCatList.querySelectorAll('.sidebar-cat-item').forEach(item => {
        item.addEventListener('click', () => {
          currentCat = item.dataset.id;
          renderSidebar();
          renderProducts();
        });
      });
    }

    function renderProducts() {
      const q = (pageSearch ? pageSearch.value : '').toLowerCase().trim();

      const filtered = PRODUCTS.filter(p => {
        const matchQ = !q || p.name.toLowerCase().includes(q) || (p.description && p.description.toLowerCase().includes(q)) || (p.application && p.application.toLowerCase().includes(q));
        const matchCat = currentCat === 'all' || p.categoryId == currentCat;
        return matchQ && matchCat;
      });

      // Update titles and counts
      if (currentCat === 'all') {
        if (pageCategoryTitle) pageCategoryTitle.textContent = 'Our Products';
        if (breadcrumbCurrent) breadcrumbCurrent.textContent = 'Our Products';
      } else {
        const activeCatObj = CATEGORIES.find(c => String(c.id) === String(currentCat));
        const catTitle = activeCatObj ? activeCatObj.name : 'Category';
        if (pageCategoryTitle) pageCategoryTitle.textContent = catTitle;
        if (breadcrumbCurrent) breadcrumbCurrent.textContent = catTitle;
      }

      if (productTotalCount) {
        productTotalCount.textContent = `Showing ${filtered.length} product${filtered.length === 1 ? '' : 's'}`;
      }

      if (filtered.length === 0) {
        productPageGrid.innerHTML = `<div class="empty-state" style="grid-column: 1 / -1;"><h3>No products found.</h3><p>Try a different search keyword or category.</p></div>`;
      } else {
        productPageGrid.innerHTML = filtered.map(p => createProductCard(p)).join('');
      }

      document.querySelectorAll('.reveal:not(.visible)').forEach(el => {
        setTimeout(() => el.classList.add('visible'), 50);
      });
    }

    if (pageSearch) pageSearch.addEventListener('input', renderProducts);

    renderSidebar();
    renderProducts();
  }

});

// === MODAL LOGIC (Global Scope) ===
function openProductModal(id) {
  const product = PRODUCTS.find(p => p.id == id);
  if (!product) return;

  const modal = document.getElementById('productModal');
  if (!modal) return;

  const catName = CATEGORIES.find(c => c.id == product.categoryId)?.name || "Uncategorized";
  const imgUrl = product.image || 'https://images.unsplash.com/photo-1581093458791-9d42e0f2f0d8?auto=format&fit=crop&w=600&q=80';

  document.getElementById('modalImg').src = imgUrl;
  document.getElementById('modalCatTag').textContent = catName;
  document.getElementById('modalName').textContent = product.name;
  document.getElementById('modalDesc').textContent = product.description;
  document.getElementById('modalApp').textContent = product.application || 'N/A';
  document.getElementById('modalMat').textContent = product.material || 'N/A';

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
