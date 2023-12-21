import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6 } from "lucide-react";
import { FC, useState } from "react";

const dices = [
  <Dice1 size={18} key="dice-1" />,
  <Dice2 size={18} key="dice-2" />,
  <Dice3 size={18} key="dice-3" />,
  <Dice4 size={18} key="dice-4" />,
  <Dice5 size={18} key="dice-5" />,
  <Dice6 size={18} key="dice-6" />,
];

export const Dice: FC = () => {
  const [click, setClick] = useState(false);
  const [currentNumber, setCurrentNumber] = useState(3);
  const rollDice = () => {
    let rollingTime = 0;
    setClick(true);

    const rollInterval = setInterval(
      () => {
        setCurrentNumber(Math.floor(Math.random() * 6));
        rollingTime += 100;
        // Slow down the rolling
        if (rollingTime >= 1200) {
          clearInterval(rollInterval);
          setClick(false);
        }
      },
      100 - rollingTime / 20,
    );
  };
  return (
    <div
      className={click ? "animate-[shake_1.2s_ease-in-out]" : ""}
      onClick={(event) => {
        event.preventDefault();
        rollDice();
      }}
    >
      {dices[currentNumber]}
    </div>
  );
};
