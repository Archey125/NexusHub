/* eslint-disable @typescript-eslint/no-explicit-any */
import {
   Box, Container, Flex, Heading, Text, SimpleGrid, IconButton, GridItem,
   useColorModeValue, VStack, HStack, Button, Icon, Slider, SliderTrack, SliderFilledTrack,
} from '@chakra-ui/react';
import { RepeatIcon, ArrowForwardIcon } from '@chakra-ui/icons';
import { useQuery } from '@tanstack/react-query';
import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FaStickyNote, FaLayerGroup, FaDice, FaGlobe, FaPlay, FaPause, FaMusic } from 'react-icons/fa';

import { supabase } from '../lib/supabase';
import { useAuth } from '../components/auth/useAuth'
import { useThemeStore } from '../store/themeStore';
import { usePlayerStore } from '../store/playerStore'

import { CardItem } from '../features/cards/CardItem';
import { LinkCard } from '../features/browser/LinkCard';
import { GeneratorCard } from '../features/generators/GeneratorCard';
import { NumberGeneratorCard } from '../features/generators/NumberGeneratorCard';

const slideVariants = {
   hidden: { opacity: 0, y: -20 },
   visible: { opacity: 1, y: 0, transition: { duration: 1.5 } }
};

export const Home = () => {
   const { user } = useAuth();
   const { accentColor } = useThemeStore();
   const navigate = useNavigate();
   const { playTrack, currentTrack, isPlaying, togglePlay } = usePlayerStore(); // для плеера

   const bgCard = useColorModeValue('white', 'gray.700');
   const textColor = useColorModeValue('gray.600', 'gray.400');
   const itemHoverBg = useColorModeValue('gray.100', 'gray.600');

   // данные из категорий
   const { data: allLinks } = useQuery({ queryKey: ['home-links'], queryFn: async () => (await supabase.from('browser_links').select('*')).data });
   const { data: allCards } = useQuery({ queryKey: ['home-cards'], queryFn: async () => (await supabase.from('cards').select('*')).data });
   const { data: allGens } = useQuery({ queryKey: ['home-gens'], queryFn: async () => (await supabase.from('generators').select('*')).data });
   const { data: allTracks } = useQuery({ queryKey: ['home-tracks'], queryFn: async () => (await supabase.from('tracks').select('*')).data });

   const [randomLinks, setRandomLinks] = useState<any[]>([]);
   const [randomNote, setRandomNote] = useState<any>(null);
   const [randomCard, setRandomCard] = useState<any>(null);
   const [randomGen, setRandomGen] = useState<any>(null);
   const [randomTrack, setRandomTrack] = useState<any>(null);

   // выбор элементов из категорий
   const rerollLinks = useCallback(() => {
      if (!allLinks?.length) return;
      setRandomLinks([...allLinks].sort(() => 0.5 - Math.random()).slice(0, 5));
   }, [allLinks]);

   const rerollNote = useCallback(() => {
      if (!allCards?.length) return;
      // фильтруем заметки (без картинки)
      const notes = allCards.filter((c: any) => !c.background_image);
      if (notes.length === 0) {
         setRandomNote(null);
         return;
      }
      const rnd = notes[Math.floor(Math.random() * notes.length)];
      setRandomNote(rnd);
   }, [allCards]);

   const rerollCard = useCallback(() => {
      if (!allCards?.length) return;
      // фильтруем карточки (с картинкой)
      const cards = allCards.filter((c: any) => c.background_image);
      if (cards.length === 0) {
         setRandomCard(null);
         return;
      }
      const rnd = cards[Math.floor(Math.random() * cards.length)];
      setRandomCard(rnd);
   }, [allCards]);

   const rerollGen = useCallback(() => {
      if (!allGens?.length) return;
      const rnd = allGens[Math.floor(Math.random() * allGens.length)];
      setRandomGen(rnd);
   }, [allGens]);

   const rerollTrack = useCallback(() => {
      if (!allTracks?.length) return;
      const rnd = allTracks[Math.floor(Math.random() * allTracks.length)];
      setRandomTrack(rnd);
   }, [allTracks]);

   useEffect(() => {
      if (allLinks) setTimeout(rerollLinks, 0);
   }, [allLinks, rerollLinks]);

   useEffect(() => {
      if (allCards) {
         // запускаем оба реролла для карточек
         setTimeout(() => { rerollNote(); rerollCard(); }, 0);
      }
   }, [allCards, rerollNote, rerollCard]);

   useEffect(() => {
      if (allGens) setTimeout(rerollGen, 0);
   }, [allGens, rerollGen]);

   useEffect(() => {
      if (allTracks) setTimeout(rerollTrack, 0);
   }, [allTracks, rerollTrack]);


   const greeting = new Date().getHours() < 12 ? 'Доброе утро' : new Date().getHours() < 18 ? 'Добрый день' : 'Добрый вечер';

   // хендлер плеера
   const isThisTrackPlaying = currentTrack?.id === randomTrack?.id;
   const handlePlayTrack = () => {
      if (isThisTrackPlaying) togglePlay();
      else playTrack({
         ...randomTrack,
         url: randomTrack.storage_path
      });
   };

   return (
      <motion.div initial="hidden" animate="visible" variants={slideVariants}>
         <Container maxW="container.xl" py={8} pb={20}>

            {/* Хедер */}
            <VStack align="start" mb={10} spacing={1}>
               <Heading size="2xl">
                  {greeting}, <Text as="span" color={`${accentColor}.500`}>{user?.user_metadata?.full_name || 'Странник'}</Text>
               </Heading>
               <Text color={textColor} fontSize="lg">Добро пожаловать в NexusHub.</Text>
            </VStack>

            {/* Сетка с контентом */}
            <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={8}>

               {/* Ссылки */}
               <Box bg={bgCard} p={6} borderRadius="xl" boxShadow="md" h="340px" overflowY="auto">
                  <Flex justify="space-between" align="center" mb={4}>
                     <HStack><Icon as={FaGlobe} color={`${accentColor}.500`} /><Heading size="md">Закладки</Heading></HStack>
                     <IconButton aria-label="reroll" icon={<RepeatIcon />} size="sm" variant="ghost" onClick={rerollLinks} />
                  </Flex>
                  {randomLinks.length > 0 ? (
                     <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={3}>
                        {randomLinks.map(link => (
                           <LinkCard 
                              link={link} 
                              onDelete={() => {}}
                              onEdit={() => {}} 
                              isHome={true}
                           />
                        ))}
                     </SimpleGrid>
                  ) : <Text color={`${accentColor}.500`}>Пусто</Text>}
               </Box>

               {/* Заметки */}
               <Box bg={bgCard} p={6} borderRadius="xl" boxShadow="md" h="340px" display="flex" flexDirection="column">
                  <Flex justify="space-between" align="center" mb={4}>
                     <HStack><Icon as={FaStickyNote} color={`${accentColor}.500`} /><Heading size="md">Заметка</Heading></HStack>
                     <IconButton aria-label="reroll" icon={<RepeatIcon />} size="sm" variant="ghost" onClick={rerollNote} />
                  </Flex>
                  {randomNote ? (
                     <VStack align="stretch" flex={1} spacing={3} overflow="hidden">
                        <Heading size="md" noOfLines={2}>{randomNote.title}</Heading>
                        <Box
                           noOfLines={5}
                           color={`${accentColor}.600`} _dark={{ color: textColor }}
                           dangerouslySetInnerHTML={{ __html: randomNote.description || "Нет описания..." }}
                           sx={{
                              'ul': { paddingLeft: '1.2em', listStyleType: 'disc', textAlign: 'left' },
                              'ol': { paddingLeft: '1.2em', listStyleType: 'decimal', textAlign: 'left' },
                              'li': { marginBottom: '0.2em' },
                              'p': { marginBottom: '0.5em' }
                           }}
                        />
                        <Button size="sm" mt="auto" alignSelf="start" leftIcon={<ArrowForwardIcon />} onClick={() => navigate(`/card/${randomNote.id}`)}>Открыть</Button>
                     </VStack>
                  ) : <Text color={`${accentColor}.500`}>Нет заметок</Text>}
               </Box>

               {/* Карточки */}
               <Box bg={bgCard} p={6} borderRadius="xl" boxShadow="md" minH="340px">
                  <Flex justify="space-between" align="center" mb={4}>
                     <HStack><Icon as={FaLayerGroup} color={`${accentColor}.500`} /><Heading size="md">Архив</Heading></HStack>
                     <IconButton aria-label="reroll" icon={<RepeatIcon />} size="sm" variant="ghost" onClick={rerollCard} />
                  </Flex>
                  {randomCard ? (
                     <Flex justify="center" h="100%" pb={8}>
                        <Box w="200px">
                           <CardItem card={randomCard} onClick={() => navigate(`/card/${randomCard.id}`)} />
                        </Box>
                     </Flex>
                  ) : <Text color={`${accentColor}.500`}>Пусто</Text>}
               </Box>

               {/* Генераторы */}
               <Box bg={bgCard} p={6} borderRadius="xl" boxShadow="md" minH="340px">
                  <Flex justify="space-between" align="center" mb={4}>
                     <HStack><Icon as={FaDice} color={`${accentColor}.500`} /><Heading size="md">Рандом</Heading></HStack>
                     <IconButton aria-label="reroll" icon={<RepeatIcon />} size="sm" variant="ghost" onClick={rerollGen} />
                  </Flex>
                  {randomGen ? (
                     <Box h="240px">{(randomGen as any).type === 'number' ? <NumberGeneratorCard generator={randomGen} /> : <GeneratorCard generator={randomGen} />}</Box>
                  ) : <Text color={`${accentColor}.500`}>Пусто</Text>}
               </Box>

               {/* Треки */}
               <GridItem colSpan={{ base: 1, lg: 2 }}>
                  <Box bg={bgCard} p={6} borderRadius="xl" boxShadow="md">
                     <Flex justify="space-between" align="center" mb={4}>
                        <HStack><Icon as={FaMusic} color={`${accentColor}.500`} /><Heading size="md">Случайный трек</Heading></HStack>
                        <IconButton aria-label="reroll" icon={<RepeatIcon />} size="sm" variant="ghost" onClick={rerollTrack} />
                     </Flex>

                     {randomTrack ? (
                        <Flex align="center" gap={4} p={4} bg={itemHoverBg} borderRadius="lg">
                           <IconButton
                              aria-label="Play" icon={isThisTrackPlaying && isPlaying ? <FaPause /> : <FaPlay />}
                              colorScheme={accentColor} rounded="full" size="lg" onClick={handlePlayTrack}
                           />
                           <VStack align="start" flex={1} spacing={0}>
                              <Text fontWeight="bold" fontSize="lg">{randomTrack.title}</Text>
                              <Text color={`${accentColor}.500`}>{randomTrack.artist}</Text>
                              {/* Прогресс бар */}
                              <Box w="100%" mt={2}>
                                 <Slider value={isThisTrackPlaying ? 0 : 0} isReadOnly>
                                    <SliderTrack><SliderFilledTrack bg={`${accentColor}.500`} /></SliderTrack>
                                 </Slider>
                              </Box>
                           </VStack>
                        </Flex>
                     ) : <Text color={`${accentColor}.500`}>Нет музыки</Text>}
                  </Box>
               </GridItem>

            </SimpleGrid>

         </Container>
      </motion.div>
   );
};