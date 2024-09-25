Movie Booking Interface ( Javascript/HTML Webpage )
-----
developed by Hunter Mcvay and I

```bash
!! database is no longer being hosted externally !!
```
How to run:
```bash
> Host and create a database locally or on a server using the database.sql code
> Modify databasePool.js in Backend/database to match the host, user, password, and database to your MySQL server
> Modify sendgrid.env and server.js to update the Email functionality 
```

Description:
-
A Movie Booking interface where users can create and login into accounts using an email, username, and password. Info gets tokenized and saved onto a database which was hosted on a cloud server. There are "admin" users and "default" users. Admins are able to suspend, edit, and delete users. Admins can also add, edit, and delete Movies giving them a title, decription, image, cast, etc. Default users are able to book a specific movie at a specific time and reserve a specific seat. All this info gets saved in the database. I was the database engineer: I wrote all the SQL code and setup the database to be hosted on a cloud server. I also wrote all the HTML and Javascript for the pages that had any interaction with the database.
