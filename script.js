document.addEventListener('DOMContentLoaded', () => {
  
  // ==========================================
  // 1. 省電力効果シミュレーターのロジック
  // ==========================================
  
  const motorKwInput = document.getElementById('motor-kw');
  const hoursDayInput = document.getElementById('hours-day');
  const daysYearInput = document.getElementById('days-year');
  const elecPriceInput = document.getElementById('elec-price');
  const initCostInput = document.getElementById('init-cost');

  const motorKwVal = document.getElementById('motor-kw-val');
  const hoursDayVal = document.getElementById('hours-day-val');
  const daysYearVal = document.getElementById('days-year-val');
  const elecPriceVal = document.getElementById('elec-price-val');
  const initCostVal = document.getElementById('init-cost-val');

  const calcSavingsMoney = document.getElementById('calc-savings-money');
  const calcSavingsKwh = document.getElementById('calc-savings-kwh');
  const calcCo2 = document.getElementById('calc-co2');
  const calcRoi = document.getElementById('calc-roi');

  function calculateSavings() {
    const kw = parseFloat(motorKwInput.value);
    const hours = parseInt(hoursDayInput.value, 10);
    const days = parseInt(daysYearInput.value, 10);
    const price = parseInt(elecPriceInput.value, 10);
    const initCost = parseInt(initCostInput.value, 10);

    // スライダーの値表示を更新
    motorKwVal.textContent = `${kw.toFixed(1)} kW`;
    hoursDayVal.textContent = `${hours} 時間`;
    daysYearVal.textContent = `${days} 日`;
    elecPriceVal.textContent = `${price} 円/kWh`;
    initCostVal.textContent = `${initCost} 万円`;

    // 削減計算ロジック
    // 基準消費電力 (全速60Hz運転時、モータ定格の85%負荷と想定)
    const loadFactor = 0.85;
    const baseKwhPerYear = kw * loadFactor * hours * days;
    
    // 実測データに基づく平均削減率: 60.6% (消費電力比 39.4%)
    const reductionRatio = 0.606;
    const savingsKwh = baseKwhPerYear * reductionRatio;
    const savingsMoney = savingsKwh * price;
    
    // CO2排出係数 (環境省公表の電気事業者別排出係数平均値に近い値: 0.00045 t-CO2/kWh)
    const co2SavedTon = savingsKwh * 0.00045;

    // 投資回収年数計算 (導入費用は「万円」なので10000をかける)
    const roiYears = savingsMoney > 0 ? (initCost * 10000) / savingsMoney : 0;

    // UI表示の更新 (数値フォーマット)
    calcSavingsMoney.textContent = `¥${Math.round(savingsMoney).toLocaleString()}`;
    calcSavingsKwh.textContent = `${Math.round(savingsKwh).toLocaleString()} kWh`;
    calcCo2.textContent = `${co2SavedTon.toFixed(1)} トン`;
    calcRoi.textContent = roiYears > 0 ? `${roiYears.toFixed(1)} 年` : '算出不可';
  }

  // スライダーイベントの紐付け
  [motorKwInput, hoursDayInput, daysYearInput, elecPriceInput, initCostInput].forEach(input => {
    input.addEventListener('input', calculateSavings);
  });

  // 初期計算の実行
  calculateSavings();


  // ==========================================
  // 2. 制御モード切り替えデモのロジック
  // ==========================================

  const modeButtons = document.querySelectorAll('.mode-btn');
  const modeTitle = document.getElementById('mode-title');
  const modeDesc = document.getElementById('mode-desc');
  const visualizationArea = document.getElementById('visualization-area');

  const modeData = {
    pid: {
      title: 'PID（PI）制御運転',
      desc: 'PLC内蔵のPIDアルゴリズムを使用。還気と給気の温度差をもとに、インバータ設定周波数を30Hzから45Hzの間で極めて滑らかに制御します。微分（D）動作は環境特性を考慮して0に設定し、オーバーシュートのない安定したPI制御を行います。無駄な周波数の跳ね上がりがなく、最も省エネ効果が高い推奨モードです。',
      visual: `<svg class="sine-wave" viewBox="0 0 400 120">
                 <path d="M 0 80 Q 50 20 100 80 T 200 80 T 300 80 T 400 80" />
               </svg>
               <span style="position: absolute; bottom: 10px; font-size: 0.8rem; color: var(--text-muted);">なだらかな周波数遷移のイメージ（30Hz 〜 45Hz）</span>`
    },
    fixed: {
      title: '固定パラメータ運転',
      desc: '給気温度と還気温度の「温度差」の大きさに応じて、あらかじめ設定した固定周波数マップに段階的に切り替える制御です（例：差が2℃未満なら30Hz、2℃以上4℃未満なら38Hz、4℃以上なら45Hz）。PID制御に比べてパラメータ調整が容易で、動作が予測しやすい特徴があります。',
      visual: `<div class="visual-graph">
                 <div class="graph-bar graph-bar-active" style="height: 30%;"></div>
                 <div class="graph-bar graph-bar-active" style="height: 50%;"></div>
                 <div class="graph-bar graph-bar-active" style="height: 80%;"></div>
                 <div class="graph-bar graph-bar-active" style="height: 50%;"></div>
                 <div class="graph-bar graph-bar-active" style="height: 30%;"></div>
               </div>
               <span style="position: absolute; bottom: 10px; font-size: 0.8rem; color: var(--text-muted);">温度差ステップに応じた段階的な周波数切り替え</span>`
    },
    binary: {
      title: '2値化制御（クリーンヒット制御）',
      desc: '5分毎に温度差をサンプリング判定する、非常にシンプルな制御方式です。給気と還気の温度差が設定境界値（デフォルト±5℃）以内の場合は「最低周波数（30Hz）」で省エネ運転し、境界値を超えた場合のみ「最高周波数（45Hz）」で急速運転します。複雑な演算を挟まないため、既存の単純な制御ステップの置き換えに適しています。',
      visual: `<div class="step-wave">
                 <div class="step-block"></div>
                 <div class="step-block step-block-up"></div>
                 <div class="step-block"></div>
                 <div class="step-block step-block-up"></div>
               </div>
               <span style="position: absolute; bottom: 10px; font-size: 0.8rem; color: var(--text-muted);">30Hzと45Hzの2つの状態のみを往復する制御</span>`
    }
  };

  modeButtons.forEach(button => {
    button.addEventListener('click', () => {
      // アクティブクラスの切り替え
      modeButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');

      // コンテンツの書き換え
      const mode = button.getAttribute('data-mode');
      const data = modeData[mode];
      
      modeTitle.textContent = data.title;
      modeDesc.textContent = data.desc;
      visualizationArea.innerHTML = data.visual;
      
      // アニメーション再トリガーのための処理（SVGなどの描画用）
      const svgPath = visualizationArea.querySelector('.sine-wave path');
      if (svgPath) {
        svgPath.style.animation = 'none';
        svgPath.offsetHeight; /* トリガーのためのリフロー */
        svgPath.style.animation = 'draw 3s ease-in-out forwards';
      }
    });
  });

  // ==========================================
  // 3. FAQ アコーディオン制御
  // ==========================================
  const faqTriggers = document.querySelectorAll('.faq-trigger');
  
  faqTriggers.forEach(trigger => {
    trigger.addEventListener('click', () => {
      const item = trigger.closest('.faq-item');
      const answer = item.querySelector('.faq-answer');
      const isExpanded = trigger.getAttribute('aria-expanded') === 'true';
      
      if (isExpanded) {
        trigger.setAttribute('aria-expanded', 'false');
        item.classList.remove('active');
        answer.style.maxHeight = null;
      } else {
        trigger.setAttribute('aria-expanded', 'true');
        item.classList.add('active');
        answer.style.maxHeight = answer.scrollHeight + 'px';
      }
    });
  });

});
