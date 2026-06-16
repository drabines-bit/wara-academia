"use client";
import React, { useId } from "react";
import Particles, { ParticlesProvider, useParticlesProvider } from "@tsparticles/react";
import type { Container, Engine, ISourceOptions } from "@tsparticles/engine";
import { loadSlim } from "@tsparticles/slim";
import { cn } from "@/lib/utils";
import { motion, useAnimation } from "framer-motion";

type ParticlesProps = {
  id?: string;
  className?: string;
  background?: string;
  particleSize?: number;
  minSize?: number;
  maxSize?: number;
  speed?: number;
  particleColor?: string;
  particleDensity?: number;
};

async function initEngine(engine: Engine) {
  await loadSlim(engine);
}

function SparklesCoreInner(props: ParticlesProps) {
  const {
    id,
    className,
    background,
    minSize,
    maxSize,
    speed,
    particleColor,
    particleDensity,
  } = props;

  const { loaded } = useParticlesProvider();
  const controls = useAnimation();
  const generatedId = useId();

  const particlesLoaded = async (container?: Container) => {
    if (container) {
      controls.start({ opacity: 1, transition: { duration: 1 } });
    }
  };

  const options: ISourceOptions = {
    background: {
      color: { value: background || "transparent" },
    },
    fullScreen: { enable: false, zIndex: 1 },
    fpsLimit: 120,
    interactivity: {
      events: {
        onClick: { enable: true, mode: "push" },
        onHover: { enable: false, mode: "repulse" },
        resize: { delay: 0.5, enable: true },
      },
      modes: {
        push: { quantity: 4 },
        repulse: { distance: 200, duration: 0.4 },
      },
    },
    particles: {
      color: { value: particleColor || "#ffffff" },
      move: {
        direction: "none",
        enable: true,
        outModes: { default: "out" },
        random: false,
        speed: { min: 0.1, max: 1 },
        straight: false,
      },
      number: {
        density: { enable: true, width: 400, height: 400 },
        value: particleDensity || 120,
      },
      opacity: {
        value: { min: 0.1, max: 1 },
        animation: {
          enable: true,
          speed: speed || 4,
          sync: false,
        },
      },
      shape: { type: "circle" },
      size: {
        value: { min: minSize || 1, max: maxSize || 3 },
      },
      stroke: { width: 0 },
    },
    detectRetina: true,
  };

  return (
    <motion.div animate={controls} className={cn("opacity-0", className)}>
      {loaded && (
        <Particles
          id={id || generatedId}
          className={cn("h-full w-full")}
          particlesLoaded={particlesLoaded}
          options={options}
        />
      )}
    </motion.div>
  );
}

export const SparklesCore = (props: ParticlesProps) => {
  return (
    <ParticlesProvider init={initEngine}>
      <SparklesCoreInner {...props} />
    </ParticlesProvider>
  );
};
