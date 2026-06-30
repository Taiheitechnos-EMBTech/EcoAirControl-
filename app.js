/* 
   app.js 
   TaiheiTechnos Air Conditioning Energy Saving System Catalog Logic 
*/

document.addEventListener('DOMContentLoaded', () => {
    // ----------------------------------------------------------------
    // 1. 省エネ削減シミュレーター
    // ----------------------------------------------------------------
    const inputCost = document.getElementById('input-monthly-cost');
    const inputDays = document.getElementById('input-operating-days');
    const inputHours = document.getElementById('input-operating-hours');

    const valCost = document.getElementById('val-monthly-cost');
    const valDays = document.getElementById('val-operating-days');
    const valHours = document.getElementById('val-operating-hours');

    const resAnnualSaving = document.getElementById('res-annual-saving');
    const resMonthlySaving = document.getElementById('res-monthly-saving');
    const resCo2Saving = document.getElementById('res-co2-saving');
    const resTreesSaving = document.getElementById('res-trees-saving');

    const REDUCTION_RATE = 0.394; // 39.4%削減 (30Hz: 40%, 45Hz: 60%)
    const KWH_PRICE = 27;         // 27円/kWh (電気代単価)
    const CO2_COEFFICIENT = 0.44; // 0.44 kg-CO2/kWh
    const TREE_CO2_ABSORB = 8.8;  // 8.8 kg-CO2/本 (杉の木1本の年間吸収量)

    function updateSimulation() {
        const cost = parseInt(inputCost.value);
        const days = parseInt(inputDays.value);
        const hours = parseInt(inputHours.value);

        // スライダー表示の更新
        valCost.textContent = cost.toLocaleString();
        valDays.textContent = days;
        valHours.textContent = hours;

        // 計算ロジック
        // 基準値は 300日、12時間稼働とした場合
        const dayFactor = days / 300;
        const hourFactor = hours / 12;

        const monthlySaving = Math.round(cost * REDUCTION_RATE);
        const annualSaving = Math.round(monthlySaving * 12 * dayFactor * hourFactor);
        
        // CO2と樹木換算
        const savedKwh = annualSaving / KWH_PRICE;
        const co2Saved = Math.round(savedKwh * CO2_COEFFICIENT);
        const treesSaved = Math.round(co2Saved / TREE_CO2_ABSORB);

        // 結果への反映（アニメーションを伴う数値更新）
        animateNumber(resAnnualSaving, annualSaving);
        resMonthlySaving.textContent = monthlySaving.toLocaleString() + ' 円';
        resCo2Saving.textContent = co2Saved.toLocaleString() + ' kg-CO2';
        resTreesSaving.textContent = '約 ' + treesSaved.toLocaleString() + ' 本分/年';
    }

    // 数値のカウントアップアニメーション
    function animateNumber(element, targetValue) {
        const startValue = parseInt(element.textContent.replace(/,/g, '')) || 0;
        const duration = 500; // 0.5秒
        const startTime = performance.now();

        function update(currentTime) {
            const elapsedTime = currentTime - startTime;
            if (elapsedTime >= duration) {
                element.textContent = targetValue.toLocaleString();
            } else {
                const progress = elapsedTime / duration;
                // イージング関数 (easeOutQuad)
                const easeProgress = progress * (2 - progress);
                const currentValue = Math.round(startValue + (targetValue - startValue) * easeProgress);
                element.textContent = currentValue.toLocaleString();
                requestAnimationFrame(update);
            }
        }
        requestAnimationFrame(update);
    }

    // イベントリスナー登録
    if (inputCost && inputDays && inputHours) {
        inputCost.addEventListener('input', updateSimulation);
        inputDays.addEventListener('input', updateSimulation);
        inputHours.addEventListener('input', updateSimulation);
        // 初回実行
        updateSimulation();
    }


    // ----------------------------------------------------------------
    // 2. 制御モードタブ切り替え
    // ----------------------------------------------------------------
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.getAttribute('data-tab');

            // ボタンのactiveクラス切り替え
            tabButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // コンテンツの表示・非表示
            tabContents.forEach(content => {
                if (content.id === targetTab) {
                    content.classList.add('active');
                } else {
                    content.classList.remove('active');
                }
            });
        });
    });


    // ----------------------------------------------------------------
    // 3. モニター切替 & リアルタイムシミュレーションデータ
    // ----------------------------------------------------------------
    const monitorToggleBtns = document.querySelectorAll('.monitor-toggle-btn');
    const monitorHmi = document.getElementById('monitor-hmi');
    const monitorWeb = document.getElementById('monitor-web');

    // 表示切り替え
    monitorToggleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            monitorToggleBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const targetMonitor = btn.getAttribute('data-monitor');
            if (targetMonitor === 'hmi') {
                monitorHmi.classList.add('active');
                monitorWeb.classList.remove('active');
            } else {
                monitorHmi.classList.remove('active');
                monitorWeb.classList.add('active');
            }
        });
    });

    // 稼働状況数値のゆらゆら（PID制御動作の表現）
    const hmiOutdoor = document.getElementById('hmi-val-outdoor');
    const hmiSupply = document.getElementById('hmi-val-supply');
    const hmiReturn = document.getElementById('hmi-val-return');
    const hmiFreq = document.getElementById('hmi-val-freq');
    const hmiPower = document.getElementById('hmi-val-power');
    const hmiTime = document.getElementById('hmi-time');

    const webOutdoor = document.getElementById('web-val-outdoor');
    const webSupply = document.getElementById('web-val-supply');
    const webReturn = document.getElementById('web-val-return');
    const webDiff = document.getElementById('web-val-diff');
    const webFreq = document.getElementById('web-val-freq');
    const webPower = document.getElementById('web-val-power');

    // 基準値
    let outdoorTemp = 28.4;
    let returnTemp = 25.1;
    let supplyTemp = 18.2;
    let frequency = 34.50;
    let power = 15.8;

    function updateMonitorData() {
        // 現在時刻の更新 (HMI風フォーマット)
        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const hh = String(now.getHours()).padStart(2, '0');
        const min = String(now.getMinutes()).padStart(2, '0');
        
        if (hmiTime) {
            hmiTime.textContent = `${yyyy}.${mm}.${dd} ${hh}:${min}`;
        }

        // 数値のランダムウォーク (PID制御の微調整っぽく)
        outdoorTemp += (Math.random() - 0.5) * 0.1;
        returnTemp += (Math.random() - 0.5) * 0.08;
        supplyTemp += (Math.random() - 0.5) * 0.12;

        // 温度範囲制限
        outdoorTemp = Math.max(28.0, Math.min(29.0, outdoorTemp));
        returnTemp = Math.max(24.5, Math.min(25.5, returnTemp));
        supplyTemp = Math.max(17.5, Math.min(19.0, supplyTemp));

        // 還気と給気の温度差
        const diffTemp = Math.max(0.1, returnTemp - supplyTemp);

        // 周波数制御 (温度差が大きいほど周波数を上げ、縮まれば下げるPID制御風ロジック)
        // 基準周波数は35Hz。温度差が6.9℃より大きければ周波数が上がり、小さければ下がる
        const targetFreq = 30 + (diffTemp - 5) * 2.5; 
        frequency += (targetFreq - frequency) * 0.1 + (Math.random() - 0.5) * 0.05;
        frequency = Math.max(30.00, Math.min(45.00, frequency));

        // 消費電力は周波数に比例（簡易モデル：30Hzで12.5kW、45Hzで18kW程度と想定）
        const freqRatio = (frequency - 30) / 15; // 0.0 〜 1.0
        power = 12.5 + freqRatio * 5.5 + (Math.random() - 0.5) * 0.1;

        // 画面の表示を更新
        // HMI
        if (hmiOutdoor) hmiOutdoor.textContent = outdoorTemp.toFixed(1);
        if (hmiSupply) hmiSupply.textContent = supplyTemp.toFixed(1);
        if (hmiReturn) hmiReturn.textContent = returnTemp.toFixed(1);
        if (hmiFreq) hmiFreq.textContent = frequency.toFixed(2);
        if (hmiPower) hmiPower.textContent = power.toFixed(1);

        // Web
        if (webOutdoor) webOutdoor.textContent = outdoorTemp.toFixed(1) + '℃';
        if (webReturn) webReturn.textContent = returnTemp.toFixed(1) + '℃';
        if (webSupply) webSupply.textContent = supplyTemp.toFixed(1) + '℃';
        if (webDiff) webDiff.textContent = diffTemp.toFixed(1) + '℃';
        if (webFreq) webFreq.textContent = frequency.toFixed(2) + ' Hz';
        if (webPower) webPower.textContent = power.toFixed(1) + ' kW';
    }

    // 2秒ごとにモニターデータを揺らす
    setInterval(updateMonitorData, 2000);
    updateMonitorData();


    // ----------------------------------------------------------------
    // 4. お問い合わせフォーム送信
    // ----------------------------------------------------------------
    const contactForm = document.getElementById('contact-form');
    const formSuccess = document.getElementById('form-success');
    const btnResetForm = document.getElementById('btn-reset-form');

    if (contactForm && formSuccess) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault(); // 実際の送信をキャンセル

            // 送信ボタンのローディング風表示
            const submitBtn = contactForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = '送信中...';

            // 1.5秒のディレイ後に完了表示
            setTimeout(() => {
                contactForm.classList.add('hidden');
                formSuccess.classList.remove('hidden');
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
                contactForm.reset();
            }, 1500);
        });
    }

    if (btnResetForm && contactForm && formSuccess) {
        btnResetForm.addEventListener('click', () => {
            formSuccess.classList.add('hidden');
            contactForm.classList.remove('hidden');
        });
    }

    // ----------------------------------------------------------------
    // 5. モバイルナビゲーションの開閉
    // ----------------------------------------------------------------
    const mobileToggle = document.querySelector('.mobile-nav-toggle');
    const navMenu = document.querySelector('.nav-menu');

    if (mobileToggle && navMenu) {
        mobileToggle.addEventListener('click', () => {
            mobileToggle.classList.toggle('active');
            navMenu.classList.toggle('mobile-active');
            
            // ナビゲーションメニューの表示切り替え（CSS側で対応）
            if (navMenu.classList.contains('mobile-active')) {
                navMenu.style.display = 'flex';
                navMenu.style.flexDirection = 'column';
                navMenu.style.position = 'absolute';
                navMenu.style.top = '70px';
                navMenu.style.left = '0';
                navMenu.style.width = '100%';
                navMenu.style.backgroundColor = 'white';
                navMenu.style.padding = '20px';
                navMenu.style.boxShadow = 'var(--shadow-md)';
                navMenu.style.borderBottom = '1px solid var(--gray-light)';
                
                // ハンバーガーアイコンの変形
                mobileToggle.children[0].style.transform = 'translateY(8px) rotate(45deg)';
                mobileToggle.children[1].style.opacity = '0';
                mobileToggle.children[2].style.transform = 'translateY(-8px) rotate(-45deg)';
            } else {
                navMenu.style = '';
                mobileToggle.children[0].style = '';
                mobileToggle.children[1].style = '';
                mobileToggle.children[2].style = '';
            }
        });

        // リンククリック時に閉じる
        navMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                if (navMenu.classList.contains('mobile-active')) {
                    navMenu.classList.remove('mobile-active');
                    navMenu.style = '';
                    mobileToggle.children[0].style = '';
                    mobileToggle.children[1].style = '';
                    mobileToggle.children[2].style = '';
                }
            });
        });
    }
});
