import crypto from 'crypto';

// Comparaison à temps constant pour les secrets bruts (clés API/internes).
// Les longueurs différentes ne passent pas par timingSafeEqual (qui lèverait
// une exception) : on renvoie simplement "non égal".
export function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);

  if (bufA.length !== bufB.length) {
    return false;
  }

  return crypto.timingSafeEqual(bufA, bufB);
}
