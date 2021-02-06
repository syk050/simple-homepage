CREATE TABLE `board` (
  `num` int NOT NULL AUTO_INCREMENT,
  `title` varchar(100) NOT NULL,
  `content` varchar(1000) NOT NULL,
  `readcount` int unsigned DEFAULT '0',
  `username` varchar(45) NOT NULL,
  `author` varchar(20) NOT NULL,
  `writedate` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`num`),
  KEY `board_users_id_idx` (`author`),
  CONSTRAINT `board_users_id` FOREIGN KEY (`author`) REFERENCES `users` (`id`)
)

CREATE TABLE `comment` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `boardnum` int NOT NULL,
  `author` varchar(20) NOT NULL,
  `username` varchar(45) NOT NULL,
  `text` varchar(100) NOT NULL,
  `parentComment` int unsigned DEFAULT NULL,
  `isDeleted` tinyint(1) DEFAULT '0',
  `created` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `update` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `comment_board_num_idx` (`boardnum`),
  KEY `comment_user_id_idx` (`author`),
  KEY `comment_comment_id_idx` (`parentComment`),
  CONSTRAINT `comment_board_num` FOREIGN KEY (`boardnum`) REFERENCES `board` (`num`),
  CONSTRAINT `comment_comment_id` FOREIGN KEY (`parentComment`) REFERENCES `comment` (`id`),
  CONSTRAINT `comment_user_id` FOREIGN KEY (`author`) REFERENCES `users` (`id`)
) 

CREATE TABLE `users` (
  `id` varchar(20) NOT NULL,
  `name` varchar(45) NOT NULL,
  `password` varchar(100) NOT NULL,
  `created` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
)