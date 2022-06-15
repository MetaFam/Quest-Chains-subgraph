import {
  Avatar,
  Flex,
  Grid,
  Heading,
  HStack,
  Image,
  Link as ChakraLink,
  Text,
} from '@chakra-ui/react';
import { useRef } from 'react';

export const Team: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <HStack
      w="full"
      align="center"
      justify="center"
      minH="80vh"
      bg="dark"
      bgPosition="center"
      bgAttachment="fixed"
      bgSize="cover"
      id="team"
    >
      <Flex
        ref={ref}
        display="flex"
        flexDirection="column"
        lineHeight={{ base: 'lg', '2xl': '2xl' }}
        pl={{ base: 0, md: 0 }}
        marginInlineStart="0 !important"
        zIndex={100}
        w="full"
        fontWeight="normal"
        color="white"
      >
        <Flex align="center" mb={10} flexDir="column">
          <Heading
            color="main"
            fontSize={79}
            pb={10}
            fontWeight="normal"
            display="flex"
          >
            Team
          </Heading>
          <Grid gap={8} templateColumns="repeat(4, 1fr)" height="20rem">
            <Flex
              flexDir="column"
              alignItems="center"
              background="linear-gradient(transparent, rgba(45, 248, 199, 0.2))"
              p={8}
              borderRadius={12}
            >
              <Avatar
                name="vid"
                src="landing/profile/vid.png"
                size="2xl"
                showBorder
                borderColor="main"
              />
              <Text
                fontWeight="bold"
                mt={3}
                fontSize="lg"
                fontFamily="heading"
                mb={2}
              >
                vid
              </Text>
              <Text marginBottom="auto" fontSize="sm">
                Front-End Developer
              </Text>

              <Flex alignItems="center" justifyContent="center" gap={2}>
                <ChakraLink
                  href="https://github.com/vidvidvid"
                  isExternal
                  borderRadius="full"
                >
                  <Image
                    src="landing/contact/github.png"
                    alt="ipfs"
                    height={6}
                  />
                </ChakraLink>
                <ChakraLink
                  href="https://www.linkedin.com/in/vid-topolovec-62a152a4/"
                  isExternal
                  borderRadius="full"
                >
                  <Image
                    src="landing/contact/linkedin.png"
                    alt="ipfs"
                    height={6}
                  />
                </ChakraLink>
                <ChakraLink
                  href="https://twitter.com/viiiiiid1"
                  isExternal
                  borderRadius="full"
                >
                  <Image
                    src="landing/contact/twitter.png"
                    alt="ipfs"
                    height={6}
                  />
                </ChakraLink>
              </Flex>
            </Flex>
            <Flex
              flexDir="column"
              alignItems="center"
              background="linear-gradient(transparent, rgba(45, 248, 199, 0.2))"
              p={8}
              borderRadius={12}
            >
              <Avatar
                name="dan13ram"
                src="landing/profile/dan.jpeg"
                size="2xl"
                showBorder
                borderColor="main"
              />
              <Text
                fontWeight="bold"
                mt={3}
                fontSize="lg"
                fontFamily="heading"
                mb={2}
              >
                dan13ram
              </Text>
              <Text marginBottom="auto" fontSize="sm">
                Full-Stack Developer
              </Text>

              <Flex alignItems="center" justifyContent="center">
                <ChakraLink
                  href="https://github.com/dan13ram"
                  isExternal
                  borderRadius="full"
                  mr={2}
                >
                  <Image
                    src="landing/contact/github.png"
                    alt="ipfs"
                    height={6}
                  />
                </ChakraLink>
                <ChakraLink
                  href="https://twitter.com/dan13ram"
                  isExternal
                  borderRadius="full"
                >
                  <Image
                    src="landing/contact/twitter.png"
                    alt="ipfs"
                    height={6}
                  />
                </ChakraLink>
              </Flex>
            </Flex>
            <Flex
              flexDir="column"
              alignItems="center"
              background="linear-gradient(transparent, rgba(45, 248, 199, 0.2))"
              p={8}
              borderRadius={12}
            >
              <Avatar
                name="Dave"
                src="landing/profile/dave.jpg"
                size="2xl"
                showBorder
                borderColor="main"
              />
              <Text
                fontWeight="bold"
                mt={3}
                fontSize="lg"
                fontFamily="heading"
                mb={2}
              >
                Dave
              </Text>
              <Text marginBottom="auto" fontSize="sm">
                Product Designer
              </Text>

              <Flex alignItems="center" justifyContent="center" gap={2}>
                <ChakraLink
                  href="https://www.linkedin.com/in/davortomic/"
                  isExternal
                  borderRadius="full"
                >
                  <Image
                    src="landing/contact/linkedin.png"
                    alt="ipfs"
                    height={6}
                  />
                </ChakraLink>
                <ChakraLink
                  href="https://bit.ly/Portfolio-Davor_Tomic"
                  isExternal
                  borderRadius="full"
                >
                  <Heading
                    color="blue.200"
                    fontSize={'xl'}
                    fontWeight="normal"
                    lineHeight="1rem"
                  >
                    Portfolio
                  </Heading>
                </ChakraLink>
              </Flex>
            </Flex>
            <Flex
              flexDir="column"
              alignItems="center"
              background="linear-gradient(transparent, rgba(45, 248, 199, 0.2))"
              p={8}
              borderRadius={12}
            >
              <Avatar
                name="Beti"
                src="landing/profile/beti.png"
                size="2xl"
                showBorder
                borderColor="main"
              />
              <Text
                fontWeight="bold"
                mt={3}
                fontSize="lg"
                fontFamily="heading"
                mb={2}
              >
                beti
              </Text>
              <Text marginBottom="auto" fontSize="sm">
                UI/UX & Artist
              </Text>
              <Flex alignItems="center" justifyContent="center">
                <ChakraLink
                  href="https://www.behance.net/betifrim"
                  isExternal
                  borderRadius="full"
                >
                  <Heading
                    color="blue.200"
                    fontSize={'xl'}
                    fontWeight="normal"
                    lineHeight="1rem"
                  >
                    Portfolio
                  </Heading>
                </ChakraLink>
              </Flex>
            </Flex>
          </Grid>
        </Flex>
      </Flex>
    </HStack>
  );
};
