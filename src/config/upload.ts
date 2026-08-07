/*
 * Copyright 2021 WPPConnect Team
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const __dirname = path.resolve(path.dirname(''));
    cb(null, path.resolve(__dirname, 'uploads'));
  },
  filename: function (req, file, cb) {
    const filename = `wppConnect-${Date.now()}-${file.originalname}`;
    cb(null, filename);
  },
});

// Aucune limite de taille n'était configurée (illimité par défaut chez
// multer) — un upload multipart pouvait saturer le disque/la mémoire sans
// aucun plafond, contrairement au corps JSON qui a au moins une limite
// explicite (15mb, voir index.ts). 25mb reste cohérent avec des médias
// WhatsApp (images/documents), au-delà desquels un upload est
// vraisemblablement anormal.
const uploads = multer({
  storage: storage,
  limits: { fileSize: 25 * 1024 * 1024 },
});
export default uploads;
