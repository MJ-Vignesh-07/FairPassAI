import React, { useState, useEffect } from 'react';
import { ShieldCheck, RefreshCw, CheckCircle2, Lock } from 'lucide-react';

export default function VerificationChallenge({ onVerifySuccess }) {
  const [challengeType, setChallengeType] = useState('math'); // 'math' or 'slider'
  const [num1, setNum1] = useState(0);
  const [num2, setNum2] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [sliderValue, setSliderValue] = useState(0);
  const [targetSlider, setTargetSlider] = useState(85);
  const [isSolved, setIsSolved] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const generateMathProblem = () => {
    const a = Math.floor(Math.random() * 8) + 2;
    const b = Math.floor(Math.random() * 8) + 2;
    setNum1(a);
    setNum2(b);
    setUserAnswer('');
    setErrorMsg('');
  };

  useEffect(() => {
    generateMathProblem();
    setTargetSlider(Math.floor(Math.random() * 30) + 70); // 70 to 100
  }, []);

  const handleMathSubmit = (e) => {
    e.preventDefault();
    if (parseInt(userAnswer.trim(), 10) === (num1 + num2)) {
      setIsSolved(true);
      setErrorMsg('');
      setTimeout(() => {
        onVerifySuccess();
      }, 600);
    } else {
      setErrorMsg('Incorrect answer. Please try again.');
      generateMathProblem();
    }
  };

  const handleSliderChange = (e) => {
    const val = parseInt(e.target.value, 10);
    setSliderValue(val);
    if (val >= 98) {
      setIsSolved(true);
      setTimeout(() => {
        onVerifySuccess();
      }, 600);
    }
  };

  return (
    <div className="verification-box">
      <div className="verification-header">
        <div className="verification-badge">
          <ShieldCheck size={16} />
          <span>FairPass Security Challenge</span>
        </div>
        <div className="challenge-toggle">
          <button
            type="button"
            className={`tab-btn-mini ${challengeType === 'math' ? 'active' : ''}`}
            onClick={() => setChallengeType('math')}
          >
            Human Math
          </button>
          <button
            type="button"
            className={`tab-btn-mini ${challengeType === 'slider' ? 'active' : ''}`}
            onClick={() => setChallengeType('slider')}
          >
            Slide Lock
          </button>
        </div>
      </div>

      <p className="verification-desc">
        Anti-scalping heuristic detected automated or elevated activity. Please complete this brief verification to authorize reservation.
      </p>

      {isSolved ? (
        <div className="verification-success">
          <CheckCircle2 size={24} className="text-success" />
          <span>Verification Successful! Unlocking checkout...</span>
        </div>
      ) : (
        <>
          {challengeType === 'math' ? (
            <form onSubmit={handleMathSubmit} className="math-form">
              <div className="math-display">
                <span className="math-term">{num1}</span>
                <span className="math-op">+</span>
                <span className="math-term">{num2}</span>
                <span className="math-equals">=</span>
                <input
                  type="number"
                  className="input-field math-input"
                  placeholder="?"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              {errorMsg && <div className="error-text-sm">{errorMsg}</div>}

              <div className="math-actions">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={generateMathProblem}
                >
                  <RefreshCw size={14} /> Refresh
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                >
                  Verify Now
                </button>
              </div>
            </form>
          ) : (
            <div className="slider-challenge">
              <div className="slider-instruction">
                <Lock size={15} /> Slide right to verify genuine user
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={sliderValue}
                onChange={handleSliderChange}
                className="challenge-range"
              />
              <div className="slider-bar-fill" style={{ width: `${sliderValue}%` }} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
