<?php include('includes/header-medico.php'); ?>



<section class="box__panel">
	<div class="container">
		<div class="financeiro__box">
			<div class="financeiro__title">
				<h3>Contabilidade</h3>
				<div class="row">
<div class="col-md-3">
<a class="conmenu" for="">FOLHA DE PAGAMENTO</a>
</div>
<div class="col-md-3">
<a class="conmenu" for="">NOTA FISCAIS</a>
</div>
<div class="col-md-3">
<a class="conmenu" for="">GUIAS DE RECOLHIMENTO</a>
</div>
<div class="col-md-3">
<a href="" class="btn btn-gradient">DOCUMENTOS</a>
</div>
</div>

                
				<h3 class="doch1">LISTA DE DOCUMENTOS</h3>
					<a style="width: 100%;margin-top: 10px;" href="#documentos" id="gallery_media" class="buttondocumento btn ">documento exemplo 1</a>
					<a style="width: 100%;margin-top: 10px;" href="#documentos" id="gallery_media" class="buttondocumento btn ">documento exemplo 2</a>
					<a style="width: 100%;margin-top: 10px;" href="#documentos" id="gallery_media" class="buttondocumento btn ">documento exemplo 3</a>
				</div>
			</div>


</div>
</div>
</div>
</section>

<div class="modal" id="documentos">
	<div class="modal-box">
		<div class="modal-title">
			<span class="io-toggler" data-io="0">
				<span class="io-options">
					<span class="photos" id="">ENVIAR DOCUMENTOS</span>
				</span>
			</span>
		</div>
		<div class="gallery-box">
			<div class="form form-gallery gallery-box--photos active">
				<div class="row">
					<div class="col-md-12">
						<form action="/upload-target" class="dropzone" id="file_ads">
							<div class="dz-message">Selecione arquivos do seu computador ou arraste aqui</div>
						</form>
					</div>
					<div class="col-md-4 offset-md-8">
						<input type="submit" class="btn btn-gradient" value="SALVAR">
					</div>
				</div>
			</div>
			<div class="form form-gallery gallery-box--videos">
				<div class="row">
					<div class="col-md-6">
						<form action="">
							<input type="text" name="" placeholder="URL Video">
							<input type="submit" value="IMPORT VIDEO URL" class="btn btn-gradient">
						</form>
					</div>
					<div class="col-md-6">
						<form action="/upload-target" class="dropzone" id="file_ads">
							<div class="dz-message">Select files from your computer or drag here</div>
						</form>
					</div>
					<div class="col-md-4 offset-md-8">
						<input type="submit" class="btn btn-gradient" value="SAVE">
					</div>
				</div>
			</div>
		</div>
	</div>
</div>	

<?php include('includes/footer.php'); ?>
</body>
</html>
