(async () => {
  console.log('Metal Area Modern Skin Extension Loaded');

  const getFlagCode = (country) => {
    const codes = {
      sweden: 'se',
      finland: 'fi',
      norway: 'no',
      germany: 'de',
      usa: 'us',
      'united states': 'us',
      uk: 'gb',
      'united kingdom': 'gb',
      russia: 'ru',
      france: 'fr',
      poland: 'pl',
      italy: 'it',
      canada: 'ca',
      brazil: 'br',
      australia: 'au',
      netherlands: 'nl',
      japan: 'jp',
      greece: 'gr',
      switzerland: 'ch',
      austria: 'at',
      denmark: 'dk',
      spain: 'es',
      mexico: 'mx',
      chile: 'cl',
      argentina: 'ar',
      colombia: 'co',
      portugal: 'pt',
      belgium: 'be',
      ukraine: 'ua',
      'czech republic': 'cz',
      romania: 'ro',
      hungary: 'hu',
      turkey: 'tr',
      ireland: 'ie',
      iceland: 'is',
      serbia: 'rs',
      croatia: 'hr',
      bulgaria: 'bg',
      slovakia: 'sk',
      slovenia: 'si',
      estonia: 'ee',
      latvia: 'lv',
      lithuania: 'lt',
      belarus: 'by',
      'new zealand': 'nz',
      'south africa': 'za',
      china: 'cn',
      'south korea': 'kr',
      indonesia: 'id',
      malaysia: 'my',
      philippines: 'ph',
      thailand: 'th',
      india: 'in',
      peru: 'pe',
      venezuela: 've',
      ecuador: 'ec',
      bolivia: 'bo',
      uruguay: 'uy',
      paraguay: 'py',
      'costa rica': 'cr',
      panama: 'pa',
      'puerto rico': 'pr',
      cuba: 'cu',
      'dominican republic': 'do',
    };
    const lower = (country || '').toLowerCase().trim();
    if (codes[lower]) return codes[lower];
    for (const [key, code] of Object.entries(codes)) {
      if (lower.includes(key)) return code;
    }
    return null;
  };

  const flagLink = document.createElement('link');
  flagLink.rel = 'stylesheet';
  flagLink.href = 'https://cdn.jsdelivr.net/gh/lipis/flag-icons@7.0.0/css/flag-icons.min.css';
  document.head.appendChild(flagLink);

  const isForum = window.location.search.includes('showforum=');
  const isTopic = window.location.search.includes('showtopic=');
  const isHome = window.location.pathname === '/' || (window.location.pathname === '/index.php' && !isTopic && !isForum);

  // --- Cache Cleanup ---
  const CACHE_EXPIRY_MS = 3 * 24 * 60 * 60 * 1000; // 3 days
  try {
    const now = Date.now();
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('ma_topic_')) {
        try {
          const data = JSON.parse(localStorage.getItem(key));
          if (!data.timestamp || now - data.timestamp > CACHE_EXPIRY_MS) {
            localStorage.removeItem(key);
            i--; // Adjust index after removal
          }
        } catch (e) {}
      }
    }
  } catch (err) {
    console.warn('Failed to cleanup cache', err);
  }

  if (!isForum && !isHome) {
    return;
  }

  document.body.classList.add('ma-modern-active');

  // --- 1. Clean up Left Nav Blocks ---
  const leftNav = document.getElementById('menusx');
  if (leftNav) {
    const blocks = leftNav.querySelectorAll('table.tabmain');
    blocks.forEach((block) => {
      const titleEl = block.querySelector('.sottotitolo');
      if (titleEl) {
        const text = titleEl.textContent.trim();
        if (!text.includes('Forum search') && !text.includes('Personal Menu')) {
          block.style.display = 'none';
        }
      } else {
        block.style.display = 'none';
      }
    });
    // Hide images in left nav
    const imgs = leftNav.querySelectorAll('img');
    imgs.forEach((img) => (img.style.display = 'none'));
  }

  // --- 2. Determine Target Container and Extract Topics ---
  let targetContainer = null;
  let topicLinks = [];
  let paginationHTML = '';

  if (isForum) {
    const ipbWrapper = document.getElementById('ipbwrapper');
    if (ipbWrapper) {
      // The wrapper's parent is the center column td
      targetContainer = ipbWrapper.parentElement;

      // Extract topics
      topicLinks = Array.from(ipbWrapper.querySelectorAll('a[href*="showtopic="]')).filter(
        (a) => !a.href.includes('view=getlastpost') && !a.href.includes('view=getnewpost') && !a.href.includes('pid='),
      );

      // Extract pagination
      const pageCurrent = document.querySelector('.pagecurrent');
      if (pageCurrent && pageCurrent.parentElement) {
        paginationHTML = pageCurrent.parentElement.innerHTML;
      } else {
        const stLinks = Array.from(document.querySelectorAll('a[href*="st="]')).filter((a) => !a.href.includes('getlastpost') && a.textContent.match(/^\d+$/));
        if (stLinks.length > 0) {
          paginationHTML = stLinks[0].parentElement.innerHTML;
        }
      }
    }
  } else if (isHome) {
    // Extract all audio topics globally
    topicLinks = Array.from(document.querySelectorAll('td[id^="newreltd"] a[href*="showtopic="]'));

    // Find the center column td safely by walking right from the left nav
    if (leftNav) {
      let sibling = leftNav.nextElementSibling;
      while (sibling) {
        if (sibling.tagName === 'TD' && sibling.id !== 'menudx') {
          // Skip 1% width spacers
          if (sibling.getAttribute('width') !== '1%') {
            targetContainer = sibling;
            break;
          }
        }
        sibling = sibling.nextElementSibling;
      }
    }
  }

  if (!targetContainer) {
    targetContainer = document.body; // Fallback
  }

  // Deduplicate Topics and Extract initial metadata
  const uniqueTopics = new Map();
  topicLinks.forEach((a) => {
    const href = a.getAttribute('href');
    const match = href.match(/showtopic=(\d+)/);
    if (match) {
      const id = match[1];
      const title = a.textContent.trim();

      if (!uniqueTopics.has(id) || (title.length > 2 && uniqueTopics.get(id).title.length <= 2)) {
        let genre = 'Unknown Genre';

        if (isForum) {
          const row = a.closest('tr');
          if (row) {
            const descSpan = row.querySelector('.desc');
            if (descSpan) {
              genre = descSpan.textContent.replace('Genre:', '').trim();
            } else {
              const titleMatch = title.match(/\[(.*?)\]/);
              if (titleMatch) genre = titleMatch[1];
            }
          }
        } else {
          // On homepage, the genre is often listed in the container text
          const td = a.closest('td, div, tr');
          if (td) {
            const text = td.innerText || td.textContent || '';
            const genreMatch = text.match(/(?:Genre|Жанр|Style):\s*([^\n<>]+?)(?=\s*(?:Band|Artist|Album|Группа|Исполнитель|Альбом|Size|Размер|Формат|Format|\[|$))/i);
            if (genreMatch && genreMatch[1].trim().length > 0) {
              genre = genreMatch[1].trim();
            } else {
              const titleMatch = title.match(/\[(.*?)\]/);
              if (titleMatch) genre = titleMatch[1];
            }
          } else {
            const titleMatch = title.match(/\[(.*?)\]/);
            if (titleMatch) genre = titleMatch[1];
          }
        }

        uniqueTopics.set(id, {
          id,
          url: a.href,
          title: title,
          genre: genre,
        });
      }
    }
  });

  const topics = Array.from(uniqueTopics.values()).filter((t) => {
    const titleLower = t.title.toLowerCase();
    const genreLower = (t.genre || '').toLowerCase();

    if (titleLower.includes('recommended file shares') || titleLower.includes('рекомендованные обменники')) return false;

    // Exclude video releases
    if (
      titleLower.includes('[video]') ||
      titleLower.includes('(video)') ||
      titleLower.includes('dvd') ||
      titleLower.includes('blu-ray') ||
      titleLower.includes('vhs') ||
      titleLower.includes('studio clip') ||
      titleLower.includes('full show') ||
      titleLower.includes('full concert') ||
      titleLower.includes('pro-shot') ||
      titleLower.includes('webcast') ||
      titleLower.includes('.mkv') ||
      titleLower.includes('.mp4') ||
      titleLower.includes('.avi') ||
      titleLower.includes('web-dl') ||
      titleLower.includes('bdrip') ||
      titleLower.includes('dvdrip') ||
      titleLower.includes('hdtv') ||
      genreLower.includes('video')
    ) {
      return false;
    }

    return t.title.length > 2;
  });

  // Hide legacy content if topics were found
  if (topics.length > 0) {
    if (isForum) {
      const ipbWrapper = document.getElementById('ipbwrapper');
      if (ipbWrapper) {
        const legacyTables = ipbWrapper.querySelectorAll('.borderwrap, br, table');
        legacyTables.forEach((t) => {
          if (t.id === 'logostrip' || t.closest('#logostrip') || t.querySelector('#logostrip')) return;
          t.style.display = 'none';
        });
      }
    } else if (isHome && targetContainer && targetContainer !== document.body) {
      const legacyTables = targetContainer.querySelectorAll('table');
      legacyTables.forEach((t) => {
        if (t.querySelector('a[href*="showtopic="]')) {
          t.style.display = 'none';
        }
      });
    }
  }

  // --- 3. Build the Grid UI ---
  const container = document.createElement('div');
  container.id = 'ma-modern-container';
  container.innerHTML = `
    ${paginationHTML ? `<div class="ma-pagination-wrapper">${paginationHTML}</div>` : ''}
    <div class="ma-grid" id="ma-grid"></div>
    ${paginationHTML ? `<div class="ma-pagination-wrapper">${paginationHTML}</div>` : ''}
  `;

  if (isForum) {
    const ipbWrapper = document.getElementById('ipbwrapper');
    if (ipbWrapper) ipbWrapper.appendChild(container);
    else targetContainer.appendChild(container);
  } else {
    targetContainer.appendChild(container);
  }

  const grid = document.getElementById('ma-grid');

  const observerOptions = {
    root: null,
    rootMargin: '200px', // Fetch slightly before it scrolls into view
    threshold: 0.1,
  };

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const topicId = entry.target.getAttribute('data-topic-id');
        const topic = topics.find((t) => t.id === topicId);
        if (topic) {
          fetchTopicDetails(topic);
        }
        obs.unobserve(entry.target);
      }
    });
  }, observerOptions);

  topics.forEach((topic) => {
    const card = document.createElement('div');
    card.className = 'ma-card';
    card.id = `ma-card-${topic.id}`;
    card.setAttribute('data-topic-id', topic.id);

    const cleanTitle = topic.title
      .replace(/\[.*?\]/g, '')
      .replace(/\|.*$/, '')
      .trim();

    card.innerHTML = `
      <a href="${topic.url}" class="ma-card-image-container" id="ma-img-${topic.id}">
        <div class="ma-card-image-placeholder">
           <div class="ma-spinner"></div>
           <span>Fetching details...</span>
        </div>
      </a>
      <div class="ma-card-content">
        <div class="ma-genre" id="ma-genre-${topic.id}">${topic.genre}</div>
        <div class="ma-title">${cleanTitle}</div>
        <div class="ma-card-footer">
          <div style="display: flex; flex-direction: column; align-items: flex-start; gap: 4px;">
             <div class="ma-country" id="ma-country-${topic.id}">Loading...</div>
             <div class="ma-tracklist" id="ma-tracklist-${topic.id}" style="display: none;"></div>
          </div>
        </div>
        <div class="ma-downloads" id="ma-downloads-${topic.id}"></div>
      </div>
    `;
    grid.appendChild(card);
    observer.observe(card);
  });

  // --- 4. Asynchronously Fetch Details ---
  async function fetchTopicDetails(topic) {
    try {
      const cacheKey = `ma_topic_${topic.id}`;
      let cachedData = null;
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          const hasCachedDownloadLinks = Array.isArray(parsed.downloadLinks) && parsed.downloadLinks.length > 0;
          // Only use cache if it hasn't expired and contains real download links.
          if (parsed.timestamp && Date.now() - parsed.timestamp < CACHE_EXPIRY_MS && hasCachedDownloadLinks) {
            cachedData = parsed;
          } else if (!hasCachedDownloadLinks) {
            localStorage.removeItem(cacheKey);
          }
        }
      } catch (e) {}

      let coverUrl = null;
      let country = 'Unknown';
      let fetchedGenre = null;
      let tracksCount = 0;
      let trackNames = [];
      let totalDuration = '';
      let downloadLinks = [];

      if (cachedData) {
        coverUrl = cachedData.coverUrl;
        country = cachedData.country;
        fetchedGenre = cachedData.fetchedGenre;
        tracksCount = cachedData.tracksCount;
        trackNames = cachedData.trackNames;
        totalDuration = cachedData.totalDuration;
        downloadLinks = cachedData.downloadLinks;
      } else {
        const response = await fetch(topic.url);
        const text = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'text/html');

        const firstPost = doc.querySelector('.postcolor');
        if (firstPost) {
          const img = firstPost.querySelector('img[src^="http"]');
          if (img && !img.src.includes('style_images') && !img.src.includes('topic_')) {
            coverUrl = img.src;
          }
        }

        if (firstPost) {
          const clone = firstPost.cloneNode(true);
          clone.querySelectorAll('script, style').forEach((el) => el.remove());

          clone.querySelectorAll('br').forEach((br) => br.replaceWith('\n'));
          clone.querySelectorAll('p, div, tr, li').forEach((el) => {
            el.prepend('\n');
            el.append('\n');
          });

          const postText = clone.textContent || '';

          const countryMatch = postText.match(/(?:Country|Страна)\s*[:\-]?\s*(.+?)(?=\n|\*|Format|Формат|Size|Размер|Tracklist|Треклист|Genre|Жанр|Band|Artist|Album|$)/i);
          if (countryMatch) {
            country = countryMatch[1].trim();
          }

          const genreMatch = postText.match(/(?:Genre|Жанр|Style)\s*[:\-]\s*(.+?)(?=\n|\*|Country|Страна|Format|Формат|Size|Размер|Tracklist|Треклист|Band|Artist|Album|$)/i);
          if (genreMatch && genreMatch[1].trim().length > 0) {
            fetchedGenre = genreMatch[1].trim().replace(/,$/, '').trim();
          }

          const tracklistBlockMatch = postText.match(/(?:Tracklist|Треклист)[\s\S]*?(?:Total playing|Line-up|Download|Скачать|Technical|Hidden|\*|$)/i);
          if (tracklistBlockMatch) {
            const allTracks = tracklistBlockMatch[0].match(/\b\d+\.\s*.+?(?=\n|$)/g);
            if (allTracks) {
              tracksCount = allTracks.length;
              trackNames = allTracks.map((t) => t.trim().replace(/\*+$/, ''));
            }
          }

          const timeMatch = postText.match(/(?:Total playing time|Время звучания)[^\d]*(\d{2}:\d{2}(?::\d{2})?)/i);
          if (timeMatch) {
            totalDuration = timeMatch[1];
          }
        }

        if (firstPost) {
          const aTags = firstPost.querySelectorAll('a[href]');
          aTags.forEach((a) => {
            let isInHiddenText = false;
            let el = a;

            while (el && el !== firstPost) {
              const className = (typeof el.className === 'string' ? el.className : '').toLowerCase();
              if (className.includes('hidemain') || className === 'hide') {
                isInHiddenText = true;
                break;
              }

              const prev = el.previousElementSibling;
              if (prev) {
                const prevText = (prev.textContent || '').toLowerCase();
                const prevClass = (typeof prev.className === 'string' ? prev.className : '').toLowerCase();
                if (prevText.includes('hidden text') || prevText.includes('скрытый текст') || prevClass.includes('hidetop')) {
                  isInHiddenText = true;
                  break;
                }
              }
              el = el.parentElement;
            }

            if (!isInHiddenText) return;

            const href = a.getAttribute('href');
            if (href && href.startsWith('http') && !href.includes('metalarea.org')) {
              let host = 'link';
              try {
                host = new URL(href).hostname.replace('www.', '');
              } catch (e) {}
              if (!host.includes('youtube.com') && !host.includes('youtu.be') && !href.match(/\.(jpe?g|png|gif)$/i)) {
                downloadLinks.push({ host, url: href });
              }
            }
          });
        }

        if (downloadLinks.length > 0) {
          try {
            localStorage.setItem(
              cacheKey,
              JSON.stringify({
                timestamp: Date.now(),
                coverUrl,
                country,
                fetchedGenre,
                tracksCount,
                trackNames,
                totalDuration,
                downloadLinks,
              }),
            );
          } catch (e) {}
        }
      }

      const imgContainer = document.getElementById(`ma-img-${topic.id}`);
      if (imgContainer) {
        if (coverUrl) {
          imgContainer.innerHTML = `<img src="${coverUrl}" class="ma-card-image" loading="lazy" />`;
        } else {
          imgContainer.innerHTML = `<div class="ma-card-image-placeholder">No Cover Found</div>`;
        }
      }

      const countryEl = document.getElementById(`ma-country-${topic.id}`);
      if (countryEl) {
        const code = getFlagCode(country);
        if (code) {
          countryEl.innerHTML = `<span class="fi fi-${code}" style="margin-right:6px; font-size:1.1em; border-radius:2px;"></span>${country}`;
        } else {
          countryEl.innerHTML = `📍 ${country}`;
        }
      }

      const tracklistEl = document.getElementById(`ma-tracklist-${topic.id}`);
      if (tracklistEl) {
        if (tracksCount > 0) {
          let text = `${tracksCount} Tracks`;
          if (totalDuration) text += ` / ${totalDuration}`;
          tracklistEl.innerHTML = `<span title="${trackNames.join('&#10;')}">${text}</span>`;
          tracklistEl.style.display = 'block';
        }
      }

      const genreEl = document.getElementById(`ma-genre-${topic.id}`);
      if (genreEl && fetchedGenre && (genreEl.textContent === 'Unknown Genre' || genreEl.textContent.length < 3 || genreEl.textContent.includes('...'))) {
        genreEl.textContent = fetchedGenre;
      }

      const dlContainer = document.getElementById(`ma-downloads-${topic.id}`);
      if (dlContainer) {
        if (downloadLinks.length > 0) {
          const uniqueLinks = [];
          const seenUrls = new Set();
          downloadLinks.forEach((dl) => {
            if (!seenUrls.has(dl.url)) {
              seenUrls.add(dl.url);
              uniqueLinks.push(dl);
            }
          });

          uniqueLinks.forEach((link) => {
            const btn = document.createElement('button');
            btn.className = 'ma-download-btn';
            btn.textContent = link.host;
            btn.onclick = (e) => {
              e.preventDefault();
              e.stopPropagation();
              navigator.clipboard.writeText(link.url);
              const originalText = btn.textContent;
              btn.textContent = 'Copied!';
              setTimeout(() => (btn.textContent = originalText), 1500);
            };
            dlContainer.appendChild(btn);
          });
        }
      }
    } catch (err) {
      console.error(`Failed to fetch topic ${topic.id}`, err);
      const imgContainer = document.getElementById(`ma-img-${topic.id}`);
      if (imgContainer) imgContainer.innerHTML = `<div class="ma-card-image-placeholder">Error</div>`;
      const countryEl = document.getElementById(`ma-country-${topic.id}`);
      if (countryEl) countryEl.textContent = 'Error';
    }
  }
})();
