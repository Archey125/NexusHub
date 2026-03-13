import { 
  Box, Flex, IconButton, Text, Slider, SliderTrack, SliderFilledTrack, SliderThumb, 
  useColorModeValue, HStack, VStack, useDisclosure,
} from '@chakra-ui/react';
import { 
  FaPlay, FaPause, FaStepForward, FaStepBackward, FaRandom, FaRedo, FaVolumeUp, FaVolumeMute, FaChevronUp, FaChevronDown
} from 'react-icons/fa';
import { MdRepeatOne } from 'react-icons/md';
import { usePlayerStore } from '../../store/playerStore';
import { useThemeStore } from '../../store/themeStore';
import { useRef, useEffect, useState } from 'react';

const formatTime = (seconds: number) => {
  if (!seconds) return "00:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

export const GlobalPlayer = () => {
  const { currentTrack, isPlaying, togglePlay, nextTrack, prevTrack, repeatMode, toggleRepeat, isShuffle, toggleShuffle } = usePlayerStore();

  const [volume, setVolume] = useState(1); // 1 = 100%
  const [isMuted, setIsMuted] = useState(false);

  const { accentColor } = useThemeStore();
  const bg = useColorModeValue('white', 'gray.800');
  const border = useColorModeValue('gray.200', 'gray.700');
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // состояние развернутого плеера
  const { isOpen: isExpanded, onToggle: toggleExpand } = useDisclosure();

  // управление аудио-элементом
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(() => {}); // браузер не ругался на автоплей
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentTrack]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration || 0);
    }
  };

  const handleSeek = (val: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = val;
      setCurrentTime(val);
    }
  };

  const handleVolumeChange = (val: number) => {
    const newVol = val / 100;
    setVolume(newVol);
    if (audioRef.current) {
      audioRef.current.volume = newVol;
    }
    if (newVol > 0) setIsMuted(false);
  };

  const toggleMute = () => {
    if (isMuted) {
      if (audioRef.current) audioRef.current.volume = volume;
      setIsMuted(false);
    } else {
      if (audioRef.current) audioRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  const handleEnded = () => {
    if (repeatMode === 'one' && audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
    } else {
        nextTrack();
    }
  };

  if (!currentTrack) return null;

  return (
    <Box 
      position="fixed" 
      bottom={0} left={0} right={0} 
      bg={bg} 
      borderTop="1px solid" borderColor={border} 
      zIndex={2000} 
      boxShadow="lg"
      transition="height 0.3s ease"
      // если развернут - весь экран, иначе - адаптивно
      h={isExpanded ? '100vh' : { base: '70px', md: '90px' }}
      overflow="hidden"
      display="flex"
      flexDirection="column"
    >
      {/* Скрытое Аудио */}
      <audio ref={audioRef} src={currentTrack.url} onTimeUpdate={handleTimeUpdate} onEnded={handleEnded} />

      {/* МОБИЛЬНАЯ ВЕРСИЯ (Свернутая) */}
      <Flex 
        align="center" justify="space-between" px={4} h="100%" w="100%"
        display={{ base: isExpanded ? 'none' : 'flex', md: 'none' }}
        onClick={toggleExpand}
      >
         <HStack flex={1} overflow="hidden" spacing={3}>
            {/* Обложка мини */}
            <Box boxSize="40px" bg={`${accentColor}.500`} borderRadius="md" flexShrink={0} display="flex" alignItems="center" justifyContent="center">🎵</Box>
            <VStack align="start" spacing={0} overflow="hidden">
               <Text fontWeight="bold" fontSize="sm" noOfLines={1}>{currentTrack.title}</Text>
               <Text fontSize="xs" color={`${accentColor}.500`} noOfLines={1}>{currentTrack.artist}</Text>
            </VStack>
         </HStack>
         
         <HStack spacing={1}>
            <IconButton colorScheme={accentColor} aria-label="Play" icon={isPlaying ? <FaPause /> : <FaPlay />} onClick={(e) => { e.stopPropagation(); togglePlay(); }} variant="ghost" rounded="full" />
            <IconButton colorScheme={accentColor} aria-label="Expand" icon={<FaChevronUp />} onClick={(e) => { e.stopPropagation(); toggleExpand(); }} variant="ghost" />
         </HStack>
         
         {/* Прогресс бар тонкой линией сверху */}
         <Box position="absolute" top={0} left={0} right={0} h="2px" bg="gray.200">
            <Box h="100%" bg={`${accentColor}.500`} w={`${(currentTime / duration) * 100}%`} />
         </Box>
      </Flex>

      {/* ПОЛНАЯ ВЕРСИЯ (Десктоп или Развернутая мобилка) */}
      <Flex 
        direction={{ base: 'column', md: 'row' }} 
        align="center" 
        justify="space-between" 
        h="100%" 
        px={{ base: 6, md: 8 }} 
        py={{ base: 8, md: 2 }}
        display={{ base: isExpanded ? 'flex' : 'none', md: 'flex' }}
      >
        
        {/* Кнопка "Свернуть" (Только мобилка) */}
        <IconButton 
           aria-label="Collapse" icon={<FaChevronDown />} 
           display={{ base: 'flex', md: 'none' }} 
           position="absolute" top={4} left={4} variant="ghost" 
           onClick={toggleExpand} 
        />

        {/* Обложки и информация */}
        <HStack spacing={4} w={{ base: '100%', md: '30%' }} mb={{ base: 6, md: 0 }} justifyContent={{ base: 'center', md: 'flex-start' }} flexDirection={{ base: 'column', md: 'row' }} textAlign={{ base: 'center', md: 'left' }}>
          {/* на мобилке обложка большая */}
          <Box 
            boxSize={{ base: '200px', md: '50px' }} 
            bg={`${accentColor}.500`} borderRadius="xl" shadow="xl"
            display="flex" alignItems="center" justifyContent="center" color="white" fontSize="4xl"
          >
            🎵
          </Box>
          <Box overflow="hidden" w="100%">
            <Text fontWeight="bold" fontSize={{ base: 'xl', md: 'sm' }} noOfLines={1}>{currentTrack.title}</Text>
            <Text fontSize={{ base: 'md', md: 'xs' }} color={`${accentColor}.500`} noOfLines={1}>{currentTrack.artist}</Text>
          </Box>
        </HStack>

        {/* Управление */}
        <VStack spacing={{ base: 6, md: 1 }} w={{ base: '100%', md: '40%' }}>
            {/* Кнопки */}
            <HStack spacing={6}>
              <IconButton aria-label="Shuffle" icon={<FaRandom />} variant="ghost" color={isShuffle ? `${accentColor}.500` : 'gray.400'} onClick={toggleShuffle}/>
              <IconButton aria-label="Prev" colorScheme={accentColor} icon={<FaStepBackward />} variant="ghost" fontSize="20px" onClick={prevTrack} />
              
              {/* Большая кнопка Play */}
              <IconButton 
                aria-label="Play" icon={isPlaying ? <FaPause /> : <FaPlay />} 
                colorScheme={accentColor} rounded="full" boxSize={{ base: '64px', md: '48px' }} fontSize="24px"
                onClick={togglePlay}
              />
              
              <IconButton aria-label="Next" colorScheme={accentColor} icon={<FaStepForward />} variant="ghost" fontSize="20px" onClick={nextTrack} />
              <IconButton aria-label="Repeat" icon={repeatMode === 'one' ? <MdRepeatOne /> : <FaRedo />} variant="ghost" color={repeatMode !== 'none' ? `${accentColor}.500` : 'gray.400'} onClick={toggleRepeat}/>
            </HStack>
            
            {/* Слайдер */}
            <HStack w="100%" spacing={3}>
                <Text fontSize="xs" color="gray.500" w="40px" textAlign="right">{formatTime(currentTime)}</Text>
                <Slider aria-label="seek" value={currentTime} min={0} max={duration || 100} onChange={handleSeek}>
                    <SliderTrack bg="gray.200"><SliderFilledTrack bg={`${accentColor}.500`} /></SliderTrack>
                    <SliderThumb boxSize={3} />
                </Slider>
                <Text fontSize="xs" color="gray.500" w="40px">{formatTime(duration)}</Text>
            </HStack>
        </VStack>

        {/* Громко */}
        <HStack w={{ base: '100%', md: '30%' }} justify={{ base: 'center', md: 'flex-end' }} spacing={4} mt={{ base: 6, md: 0 }}>
           <IconButton aria-label='mute' icon={isMuted ? <FaVolumeMute/> : <FaVolumeUp/>} variant="ghost" onClick={toggleMute}/>
           <Box w={{ base: '70%', md: '100px' }}>
             <Slider aria-label="volume" value={isMuted ? 0 : volume * 100} min={0} max={100} onChange={handleVolumeChange}>
               <SliderTrack bg="gray.200"><SliderFilledTrack bg="gray.500" /></SliderTrack>
               <SliderThumb boxSize={3} />
             </Slider>
           </Box>
        </HStack>

      </Flex>
    </Box>
  );
};