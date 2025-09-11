<?php
// Sicherheitsdatei - verhindert direkten Zugriff auf Upload-Ordner
http_response_code(403);
exit("Forbidden");
?>


