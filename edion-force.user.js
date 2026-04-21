// ==UserScript==
// @name         Edion 強制カートイン
// @namespace    https://github.com/dusedo/edion-cart
// @version      1.0.0
// @description  エディオン公式通販で指定商品コードをカートに強制投入する（在庫なしでもPOST試行）
// @author       dusedo
// @match        https://www.edion.com/*
// @grant        none
// @run-at       document-idle
// @updateURL    https://raw.githubusercontent.com/dusedo/edion-cart/main/edion-force.user.js
// @downloadURL  https://raw.githubusercontent.com/dusedo/edion-cart/main/edion-force.user.js
// ==/UserScript==

(function () {
  'use strict';

  const B_CD = '12106';
  const ENDPOINT = 'https://www.edion.com/intoCart';

  async function forceAddToCart(p_cd, qt) {
    const body = new URLSearchParams({
      p_cd1: p_cd,
      p_cd2: '',
      p_cd3: '',
      p_cd4: '',
      p_cd5: '',
      b_cd: B_CD,
      qt: String(qt || 1),
      cart_sts: '1',
      key: '',
    });

    const res = await fetch(ENDPOINT, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'accept': 'text/html, */*; q=0.01',
        'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'x-requested-with': 'XMLHttpRequest',
      },
      referrer: `https://www.edion.com/detail.html?p_cd=${p_cd}`,
      body: body.toString(),
    });
    const text = await res.text();
    return { status: res.status, ok: res.ok, text };
  }

  function makePanel() {
    if (document.getElementById('fci-panel')) return;

    const pcdOnPage = new URL(location.href).searchParams.get('p_cd') || '';
    const panel = document.createElement('div');
    panel.id = 'fci-panel';
    panel.style.cssText = [
      'position:fixed', 'bottom:16px', 'right:16px', 'z-index:2147483647',
      'background:#fff', 'border:2px solid #d30000', 'border-radius:8px',
      'padding:10px 12px', 'box-shadow:0 4px 14px rgba(0,0,0,.25)',
      'font:13px/1.45 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
      'width:240px', 'color:#222',
    ].join(';');
    panel.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
        <strong style="color:#d30000">強制カートイン</strong>
        <span id="fci-close" style="cursor:pointer;color:#888;font-size:16px;line-height:1">×</span>
      </div>
      <input id="fci-code" placeholder="商品コード (p_cd)" value="${pcdOnPage}"
        style="width:100%;padding:7px;box-sizing:border-box;border:1px solid #ccc;border-radius:4px;font-size:14px">
      <div style="display:flex;gap:6px;margin-top:6px">
        <input id="fci-qt" type="number" min="1" value="1"
          style="width:60px;padding:7px;box-sizing:border-box;border:1px solid #ccc;border-radius:4px;font-size:14px">
        <button id="fci-btn"
          style="flex:1;padding:8px;background:#d30000;color:#fff;border:0;border-radius:4px;font-size:14px;cursor:pointer">
          カート投入
        </button>
      </div>
      <div id="fci-out" style="margin-top:8px;font-size:11px;color:#444;word-break:break-all;max-height:90px;overflow:auto"></div>
    `;
    document.body.appendChild(panel);

    panel.querySelector('#fci-close').addEventListener('click', () => panel.remove());
    panel.querySelector('#fci-btn').addEventListener('click', async () => {
      const code = panel.querySelector('#fci-code').value.trim();
      const qt = parseInt(panel.querySelector('#fci-qt').value || '1', 10);
      const out = panel.querySelector('#fci-out');
      if (!code) { out.textContent = '商品コード入力必須'; return; }
      out.textContent = '投入中...';
      try {
        const r = await forceAddToCart(code, qt);
        out.textContent = `status=${r.status}\n${r.text.slice(0, 400)}`;
      } catch (e) {
        out.textContent = `エラー: ${e.message || e}`;
      }
    });
  }

  // URL パラメータ ?_force=<p_cd>[,<qt>] があれば自動投入
  const forceParam = new URL(location.href).searchParams.get('_force');
  if (forceParam) {
    const [pcd, qt] = forceParam.split(',');
    forceAddToCart(pcd, qt || 1)
      .then(r => alert(`強制カートイン\nstatus=${r.status}\n${r.text.slice(0, 300)}`))
      .catch(e => alert(`エラー: ${e.message || e}`));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', makePanel);
  } else {
    makePanel();
  }
})();
