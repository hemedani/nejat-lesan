import { useEffect, useState } from "react";

type UseAutoReturnTimer = (step: number, setStep: React.Dispatch<React.SetStateAction<number>>) => {
  clearAutoReturnTimer: () => void;
  remainingTime: number;
};

export const useAutoReturnTimer: UseAutoReturnTimer = (step, setStep) => {
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null); 
  const [remainingTime, setRemainingTime] = useState<number>(60); 

  useEffect(() => {
    if (step === 2) {
      if (remainingTime === 60) {
        const countdown = setInterval(() => {
          setRemainingTime((prevTime) => {
            if (prevTime <= 1) {
              clearInterval(countdown); 
              setStep(1); 
            }
            return prevTime - 1;
          });
        }, 1000); 
        setTimer(countdown);
      }
    } else if (step === 1) {
      clearAutoReturnTimer();
      setRemainingTime(60);
    }

    return () => clearAutoReturnTimer();
  }, [step]); 

  const clearAutoReturnTimer = () => {
    if (timer) {
      clearInterval(timer); 
      setTimer(null); 
    }
  };

  return { clearAutoReturnTimer, remainingTime };
};
