<?php
$current_page = basename($_SERVER['PHP_SELF']);
?>
<nav>
    <ul>
        <li><a href="/o-nas.php" <?php if($current_page == 'o-nas.php') echo 'class="active"'; ?>>O nás</a></li>
        <li><a href="/prvni-voda.php" <?php if($current_page == 'prvni-voda.php') echo 'class="active"'; ?>>Jedu na vodu poprvé</a></li>
        <li><a href="/akce.php" <?php if($current_page == 'akce.php') echo 'class="active"'; ?>>Akce</a></li>
        <li><a href="/trasy.php" <?php if($current_page == 'trasy.php') echo 'class="active"'; ?>>Trasy</a></li>
        <li><a href="/ceny.php" <?php if($current_page == 'ceny.php') echo 'class="active"'; ?>>Ceny</a></li>
        <li><a href="/pro-skoly.php" <?php if($current_page == 'pro-skoly.php') echo 'class="active"'; ?>>Pro školy</a></li>
        <li><a href="/objednavky.php" <?php if($current_page == 'objednavky.php') echo 'class="active"'; ?>>Objednávky</a></li>
    </ul>
</nav>
